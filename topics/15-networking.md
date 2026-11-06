# Networking – Retrofit, OkHttp, APIs

[⬅ Back to index](../README.md)

Covers: HTTP basics, Retrofit, OkHttp & interceptors, auth/token refresh, caching, error handling, serialization, REST vs GraphQL, WebSockets, image loading.

---

## HTTP Basics

### 1. What are the HTTP methods and status codes?

<details>
<summary>Answer</summary>

**Methods:** `GET` (read; idempotent), `POST` (create; not idempotent), `PUT` (replace; idempotent), `PATCH` (partial update), `DELETE` (idempotent), `HEAD`, `OPTIONS`.

**Status codes:**
- **2xx** success – 200 OK, 201 Created, 204 No Content.
- **3xx** redirect – 301, 302, 304 Not Modified (cache).
- **4xx** client error – 400 Bad Request, **401 Unauthorized** (not authenticated), **403 Forbidden** (no permission), 404, 409 Conflict, 422, **429 Too Many Requests**.
- **5xx** server error – 500, 502, 503 (retryable), 504.

</details>

### 2. What is REST? REST vs GraphQL vs gRPC?

<details>
<summary>Answer</summary>

- **REST** – resource-based URLs + HTTP verbs, stateless, usually JSON. Simple and cacheable, but can **over-fetch** or **under-fetch** (multiple calls per screen).
- **GraphQL** – a single endpoint where the client asks for **exactly the fields it needs**. A typed schema, one request per screen; caching is harder. Android client: **Apollo Kotlin**.
- **gRPC** – Protocol Buffers over HTTP/2. Binary, fast, strongly typed, supports streaming. Good for internal or high-performance APIs.

</details>

### 3. HTTP/1.1 vs HTTP/2? What is HTTPS/TLS?

<details>
<summary>Answer</summary>

- **HTTP/2** – **multiplexes** many requests over one TCP connection, compresses headers, and is binary. OkHttp supports it automatically. HTTP/3 runs over QUIC (UDP).
- **HTTPS** – HTTP over **TLS**: encryption + server authentication through certificates (a TLS handshake verifies the cert chain against trusted CAs). Android blocks **cleartext HTTP by default** since API 28 (configure exceptions in the Network Security Config).

</details>

---

## Retrofit & OkHttp

### 4. What is Retrofit? How does it work internally?

<details>
<summary>Answer</summary>

Retrofit is a **type-safe HTTP client** (by Square) that turns an annotated interface into an HTTP API:

```kotlin
interface UserApi {
    @GET("users/{id}") suspend fun getUser(@Path("id") id: String): UserDto
    @GET("users") suspend fun search(@Query("q") q: String, @Query("page") page: Int): List<UserDto>
    @POST("users") suspend fun create(@Body user: CreateUserRequest): Response<UserDto>
    @Multipart @POST("upload") suspend fun upload(@Part file: MultipartBody.Part): UploadDto
}
val api = Retrofit.Builder()
    .baseUrl("https://api.example.com/")
    .client(okHttpClient)
    .addConverterFactory(Json.asConverterFactory("application/json".toMediaType()))
    .build()
    .create(UserApi::class.java)
```

**Internally:** `create()` returns a **dynamic Proxy**. When you call a method, Retrofit parses its annotations once (cached in a `ServiceMethod`), builds an OkHttp `Request`, executes it through **OkHttp**, and uses a **Converter** (JSON ↔ objects) and a **CallAdapter** (`Call`, `suspend`, RxJava, Flow) to shape the result. Suspend functions are supported natively and are **main-safe** (OkHttp runs the call on its own dispatcher threads).

</details>

### 5. What is OkHttp? Retrofit vs OkHttp?

<details>
<summary>Answer</summary>

**OkHttp** is the low-level HTTP client that does the actual networking: connection pooling, HTTP/2, GZIP, caching, retries, TLS, interceptors. **Retrofit sits on top of OkHttp** and adds the declarative, type-safe API layer and (de)serialization. Ktor Client is a KMP alternative.

</details>

### 6. What are Interceptors? Application vs Network interceptors?

<details>
<summary>Answer</summary>

Interceptors are hooks in OkHttp's request chain (Chain of Responsibility) that can **observe, modify, short-circuit or retry** requests and responses:

```kotlin
class AuthInterceptor(private val tokens: TokenStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response =
        chain.proceed(chain.request().newBuilder()
            .header("Authorization", "Bearer ${tokens.accessToken}")
            .build())
}
```

- **Application interceptors** (`addInterceptor`) – called **once** per call, even when the response comes from the cache. They see the original request. Use them for auth headers, logging and common params.
- **Network interceptors** (`addNetworkInterceptor`) – called for **each actual network request** (including redirects and retries). Not called for cached responses. They can see the real connection and headers like `Content-Encoding`.

Common uses: auth headers, `HttpLoggingInterceptor` (debug builds only), adding API keys or user agents, caching headers, mock responses, Chucker for debugging.

</details>

### 7. How do you handle token refresh (401) with OkHttp?

<details>
<summary>Answer</summary>

Use an **`Authenticator`**. OkHttp calls it automatically on a **401**:

```kotlin
class TokenAuthenticator(private val tokenRepo: TokenRepository) : Authenticator {
    override fun authenticate(route: Route?, response: Response): Request? {
        if (responseCount(response) >= 2) return null           // avoid infinite loop
        synchronized(this) {                                    // only one refresh at a time
            val newToken = runBlocking { tokenRepo.refreshToken() } ?: return null  // logout
            return response.request.newBuilder()
                .header("Authorization", "Bearer $newToken").build()
        }
    }
}
```

Key points: **synchronize** so parallel 401s trigger only one refresh (check whether another thread already refreshed the token); use a **separate OkHttpClient** for the refresh call (no auth interceptor) to avoid recursion; **log the user out** if the refresh fails. `runBlocking` is acceptable here because the Authenticator already runs on an OkHttp background thread.

</details>

### 8. How do you handle API errors properly?

<details>
<summary>Answer</summary>

- Suspend functions that return `T` throw `HttpException` for non-2xx responses, and `IOException` for network problems (no internet, timeout).
- Returning `Response<T>` lets you check `isSuccessful`, `code()` and `errorBody()`.
- Wrap results in a **sealed `Result`/`NetworkResult`** in the data layer:

```kotlin
suspend fun <T> safeApiCall(call: suspend () -> T): NetworkResult<T> = try {
    NetworkResult.Success(call())
} catch (e: CancellationException) { throw e }
  catch (e: HttpException) { NetworkResult.Error(e.code(), parseError(e.response()?.errorBody())) }
  catch (e: IOException) { NetworkResult.NetworkError }
```

Map errors to **user-friendly messages** in the ViewModel. Never show raw exceptions.

</details>

### 9. How do you implement retry with exponential backoff?

<details>
<summary>Answer</summary>

```kotlin
suspend fun <T> retryWithBackoff(times: Int = 3, initialDelay: Long = 500, factor: Double = 2.0, block: suspend () -> T): T {
    var delayMs = initialDelay
    repeat(times - 1) {
        try { return block() } catch (e: IOException) { /* retry only transient errors */ }
        delay(delayMs + Random.nextLong(0, 100))   // jitter
        delayMs = (delayMs * factor).toLong()
    }
    return block()
}
```

Retry only **idempotent** calls and transient errors (IOException, 5xx, 429 with `Retry-After`). With Flow: `retryWhen { cause, attempt -> cause is IOException && attempt < 3 }`. For background sync, WorkManager's `BackoffPolicy.EXPONENTIAL`.

</details>

### 10. How does HTTP caching work with OkHttp?

<details>
<summary>Answer</summary>

Add a `Cache(cacheDir, 10 MB)` to OkHttpClient. OkHttp follows standard headers: `Cache-Control` (`max-age`, `no-cache`, `no-store`), `ETag`/`If-None-Match` and `Last-Modified`/`If-Modified-Since` (a **304 Not Modified** reuses the cached body). To serve the cache when offline, use an interceptor that sets `Cache-Control: only-if-cached, max-stale=...`. For real offline-first apps, **Room as SSOT** is better than relying on HTTP caching.

</details>

### 11. How do you configure timeouts?

<details>
<summary>Answer</summary>

`OkHttpClient.Builder().connectTimeout(15, SECONDS).readTimeout(30, SECONDS).writeTimeout(30, SECONDS).callTimeout(60, SECONDS)` (the default for each is 10 s; `callTimeout` defaults to none). Reuse **one OkHttpClient instance** (shared connection pool and threads). Create variants with `client.newBuilder()`.

</details>

### 12. Gson vs Moshi vs kotlinx.serialization?

<details>
<summary>Answer</summary>

- **Gson** – reflection-based, not Kotlin-aware (ignores defaults; can put null into non-null fields), maintenance mode.
- **Moshi** – Kotlin-aware (`KotlinJsonAdapterFactory` uses reflection; **codegen** with KSP avoids it), handles nullability.
- **kotlinx.serialization** – compile-time plugin, **no reflection**, multiplatform, supports default values, works well with R8. The recommended choice for new Kotlin projects.

</details>

### 13. How do you upload or download large files?

<details>
<summary>Answer</summary>

- **Upload:** `@Multipart` with `MultipartBody.Part`, streaming a `RequestBody` from the file (don't load it all into memory). Track progress with a custom `RequestBody` that counts bytes.
- **Download:** `@Streaming` + `ResponseBody.byteStream()` written to a file in chunks.
- For long or reliable transfers, run them in **WorkManager** (with a foreground notification for long-running work), or use `DownloadManager` for simple downloads. Resume with HTTP `Range` headers.

</details>

### 14. How do you check network connectivity?

<details>
<summary>Answer</summary>

Use `ConnectivityManager` with **`registerDefaultNetworkCallback`** (`onAvailable`, `onLost`, `onCapabilitiesChanged`), and check `NET_CAPABILITY_INTERNET` + `NET_CAPABILITY_VALIDATED`. Wrap it in a `callbackFlow` to expose `Flow<Boolean>`. `activeNetworkInfo` is deprecated. Note: "connected" doesn't guarantee the request will succeed, so always handle `IOException`s.

</details>

---

## Real-time & Other

### 15. WebSocket vs polling vs SSE vs FCM push?

<details>
<summary>Answer</summary>

- **Short polling** – request every N seconds. Simple, but wasteful.
- **Long polling** – the server holds the request open until data is available.
- **SSE (Server-Sent Events)** – a one-way server → client stream over HTTP.
- **WebSocket** – a **full-duplex**, persistent connection. Use it for chat, live tracking or trading. OkHttp supports it (`newWebSocket`). Handle reconnection with backoff, and close the socket in the background.
- **FCM (Firebase Cloud Messaging)** – push notifications when the app isn't running. Battery-friendly; the system keeps a single shared connection.

</details>

### 16. What is Firebase Cloud Messaging? Notification vs data messages?

<details>
<summary>Answer</summary>

FCM delivers push messages from the server to devices, using a per-install **registration token** (send it to your backend, and handle `onNewToken`).
- **Notification message** – when the app is in the **background**, the system tray shows it automatically. In the foreground it's delivered to `onMessageReceived`.
- **Data message** – always delivered to `onMessageReceived` (your code decides what to do). Use **high priority** only for user-visible, time-sensitive messages.

Android 13+ requires the **`POST_NOTIFICATIONS`** runtime permission.

</details>

### 17. How do image loading libraries (Glide/Coil) work?

<details>
<summary>Answer</summary>

They handle download → decode → transform → display, with:
- **Memory cache** (LruCache of bitmaps) + **disk cache**.
- **Downsampling** to the target view size (avoiding OOM).
- Request **lifecycle awareness** and **cancellation** when a view is recycled.
- Bitmap pooling, placeholders and error images, transformations, GIF/SVG support.

**Coil** is Kotlin- and coroutine-first, has a Compose `AsyncImage`, and Coil 3 is multiplatform. **Glide** is mature and Java-based.

</details>

### 18. How do you design an API layer to be testable?

<details>
<summary>Answer</summary>

- Use interfaces (Retrofit service, `RemoteDataSource`), injected through DI.
- In unit tests, use **fakes** of the data source.
- For integration tests, use OkHttp's **MockWebServer** to serve JSON fixtures and verify requests (paths, headers).
- Keep the base URL configurable (build config, a debug menu).

</details>

### 19. How do you secure API calls on Android?

<details>
<summary>Answer</summary>

HTTPS only (Network Security Config), **certificate pinning** (OkHttp `CertificatePinner`, with backup pins and a rotation plan), no secrets hard-coded in the app (keys can be extracted; use a backend proxy or short-lived tokens), store tokens in encrypted storage, strip logging in release builds, and use **Play Integrity** to check the app and device are genuine. See [Security](21-security-permissions.md).

</details>

### 20. What is Ktor client?

<details>
<summary>Answer</summary>

Ktor client is JetBrains' **multiplatform HTTP client**, coroutine-based, with pluggable engines (OkHttp on Android, Darwin on iOS) and plugins (ContentNegotiation, Auth, Logging, retries). It's the go-to networking choice in **KMP** projects, where Retrofit isn't multiplatform.

</details>


---

## More Networking Questions

### 21. TCP vs UDP? What are sockets? WebSocket vs Socket.IO?

<details>
<summary>Answer</summary>

- **TCP** – connection-oriented, **reliable and ordered** delivery (retransmission, flow control). Higher latency. Used by HTTP/1.1, HTTP/2 and WebSockets.
- **UDP** – connectionless, **no delivery or order guarantees**, low latency. Used for real-time audio/video (WebRTC), DNS, gaming, and **QUIC/HTTP/3** (which adds reliability on top of UDP).
- A **socket** is an endpoint (IP + port) for sending and receiving data over TCP or UDP.
- **WebSocket** – a standard protocol (RFC 6455) that upgrades an HTTP connection to a **full-duplex** TCP channel.
- **Socket.IO** – a **library/protocol built on top of** WebSocket (with HTTP long-polling fallback) that adds automatic reconnection, rooms, events and acknowledgements. A Socket.IO client can't talk to a plain WebSocket server, and vice versa.

</details>

### 22. JSON vs Protocol Buffers vs FlatBuffers?

<details>
<summary>Answer</summary>

| JSON | Protobuf | FlatBuffers |
|---|---|---|
| Text, human-readable | Binary, schema (`.proto`) | Binary, schema |
| Larger payloads, slower parsing | **Smaller and faster** to parse; backward and forward compatible schemas | **Zero-copy**: read fields directly from the buffer **without parsing or unpacking** |
| Easy to debug, universal | Needs code generation; used with gRPC and Proto DataStore | Best for huge or very performance-critical data (games, large offline datasets); less convenient API |

Most REST APIs use JSON. Use Protobuf (or gRPC) when payload size and speed matter, and FlatBuffers when you need near-instant access to big data without deserialization.

</details>

### 23. What options exist for network optimization in a mobile app?

<details>
<summary>Answer</summary>

- **Fewer requests**: batch them, use BFF or GraphQL endpoints shaped for each screen, and avoid N+1 calls.
- **Smaller payloads**: gzip/brotli compression (OkHttp handles gzip transparently), pagination, field filtering, Protobuf, and **appropriately sized images** (request size-specific URLs, WebP/AVIF).
- **Caching**: HTTP cache with ETags, offline cache in Room, in-memory caches. Don't refetch unchanged data.
- **Connection reuse**: one OkHttpClient, HTTP/2 multiplexing, keep-alive.
- **Prefetching** on Wi-Fi or while charging, and deferring non-urgent work to WorkManager with constraints.
- **Adapting to network quality**: lower image quality on metered or slow networks (`ConnectivityManager.isActiveNetworkMetered`, `NetworkCapabilities` bandwidth).
- **Push instead of polling**, debouncing user-triggered calls, and cancelling stale requests (`flatMapLatest`).

</details>

### 24. How do you get accurate time in an Android app?

<details>
<summary>Answer</summary>

The device clock (`System.currentTimeMillis()`) **can be changed by the user** or drift, so don't trust it for security-sensitive logic (trials, OTP expiry, ordering events).
- Use **server time**: from the `Date` HTTP response header or an API field. Store the offset `serverTime - SystemClock.elapsedRealtime()` at sync time, then compute `now = offset + elapsedRealtime()`. **`elapsedRealtime()`** is monotonic since boot (it counts deep sleep too) and the user can't change it.
- **NTP/SNTP** queries to a time server, or Google's TrueTime-style libraries.
- **`SystemClock.uptimeMillis()`** doesn't count deep sleep. Use it for measuring short intervals in the app.
- For durations, **never** subtract wall-clock timestamps. Use `elapsedRealtime()`.

</details>

---

[⬅ Previous: Dependency Injection](14-dependency-injection.md) · [⬅ Back to index](../README.md) · [Next: Data Storage ➡](16-data-storage.md)
