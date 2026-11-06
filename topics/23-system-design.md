# Android (Mobile) System Design

[⬅ Back to index](../README.md)

Covers: how to approach a mobile system design round, plus worked designs (image loader, chat app, news feed, offline-first app, file downloader, analytics SDK, location tracking, video streaming) and common building blocks.

---

### 1. How should you approach a mobile system design interview?

<details>
<summary>Answer</summary>

Follow a structured flow (~45 min):

1. **Clarify requirements (5 min)**
   - Functional: the core features. Agree on scope ("feed + like + comments; no DMs").
   - Non-functional: offline support, real-time needs, scale (DAU, items), latency, battery and data usage, security, accessibility, supported devices and min SDK.
2. **High-level design (10 min)** – draw the client architecture: UI → ViewModel → UseCase → Repository → (Remote API, Local DB, Cache). Mention modules and DI.
3. **API design (5 min)** – endpoints, pagination (**cursor-based**), payloads, REST vs GraphQL vs WebSocket, auth.
4. **Data layer / storage (10 min)** – DB schema, caching strategy, **single source of truth**, sync and conflict resolution.
5. **Deep dives (10 min)** – pick 2–3: pagination, offline, real-time, image loading, background sync, error handling and retries, performance.
6. **Trade-offs & extras** – testing, monitoring (crash and perf), analytics, feature flags, security, accessibility, i18n, scalability of the codebase (modularization).

**Talk about trade-offs** constantly. There's no single right answer.

</details>

### 2. Design an image loading library (like Glide/Coil).

<details>
<summary>Answer</summary>

**Requirements:** load from URL/file/resource into an ImageView or composable; memory and disk caching; resize/downsample; placeholders and error images; transformations; cancel when a view is recycled; lifecycle-aware; avoid OOM.

**Pipeline:**
`request(url, target size)` → **memory cache** (LruCache keyed by url+size+transformations) → hit? display.
Miss → **disk cache** (DiskLruCache, raw or transformed bytes) → hit? decode on a background thread.
Miss → **network fetch** (OkHttp) → write to disk cache → **decode with downsampling** (`inSampleSize` / `ImageDecoder` to the target size) → apply transformations → put in the memory cache → post to the main thread.

**Key design points:**
- **Request deduplication**: the same URL requested concurrently → a single network call.
- **Cancellation**: keep a request tag on the view. When the view is rebound, cancel the old request (coroutine Job).
- **Lifecycle**: pause requests in `onStop`, clear them on destroy.
- **Bitmap pooling / reuse** (`inBitmap`), hardware bitmaps.
- Thread pools: separate network (IO) from decode (CPU-bound).
- Priority (visible items first), prefetching for lists.
- Cache sizes based on device memory (~1/8 of the heap for memory). Disk cache with LRU eviction and a size cap.

</details>

### 3. Design a chat / messaging app (like WhatsApp).

<details>
<summary>Answer</summary>

**Requirements:** 1:1 and group chat, real-time delivery, offline send and read, message status (sent/delivered/read), push notifications, media messages, typing indicators, history pagination.

**Client architecture:**
- **Room as the SSOT**: tables `conversations`, `messages(id, localId, conversationId, senderId, body, status, timestamp, …)`. The UI observes a Room Flow and pages it with Paging 3.
- **Real-time**: a **WebSocket** connection while the app is in the foreground (with reconnection and exponential backoff + jitter, and a heartbeat ping). In the background, **FCM** data messages wake the app to sync and notify.
- **Sending (optimistic UI)**: insert locally with `status = PENDING` and a client-generated **UUID** (idempotency key) → show it immediately → send over the socket. If offline, enqueue a **WorkManager** job (network constraint). The server ACK updates the status to SENT; delivery and read receipts update it later.
- **Ordering**: server timestamps or sequence numbers per conversation. Deduplicate by ID.
- **Sync on reconnect**: fetch missed messages since `lastSyncCursor`.
- **Media**: upload to object storage first (with a progress notification, through WorkManager), then send a message with the URL. Thumbnails and blurhash placeholders.
- **Notifications**: MessagingStyle, inline reply (RemoteInput), grouped by conversation.
- **Security**: end-to-end encryption (Signal protocol), keys in the Keystore.
- **Scale**: index `messages(conversationId, timestamp)`, prune old media, lazy-load history.

</details>

### 4. Design a news feed / social feed (like Instagram/Twitter).

<details>
<summary>Answer</summary>

**Requirements:** an infinite scrolling feed of posts (text + images/video), like/comment, pull-to-refresh, offline viewing of cached content, fast startup.

**Design:**
- **API**: `GET /feed?cursor=xyz&limit=20` → `{ items, nextCursor }`. **Cursor pagination** is better than offset: stable when new posts are inserted, so there are no duplicates or skipped items.
- **Paging 3 + RemoteMediator**: the network writes pages into Room, and the UI reads from Room (offline-first). Store the cursors in a `remote_keys` table.
- **Refresh**: pull-to-refresh invalidates and refetches the first page. Show a "New posts" pill instead of jumping the scroll position.
- **Likes**: **optimistic update** in the DB, then the API call; roll back on failure. Queue in WorkManager when offline.
- **Media**: Coil/Glide with sized requests, **prefetching** of the next items' images, video autoplay of only the most visible item (a single ExoPlayer instance reused), and release when scrolled off.
- **Performance**: stable keys, `contentType`, DiffUtil, avoiding recomposition, Baseline Profile for the feed scroll.
- **Cache policy**: keep the last N pages and evict older ones. TTL for staleness.
- **Analytics**: impression tracking with visibility thresholds, batched and sent in the background.

</details>

### 5. Design an offline-first app (e.g. notes or to-do with sync).

<details>
<summary>Answer</summary>

- **Local DB is the source of truth**: every read comes from Room, and every write goes to Room first.
- Each record has `id` (UUID generated on the client), `updatedAt`, `syncStatus` (SYNCED / PENDING_CREATE / PENDING_UPDATE / PENDING_DELETE), and `version`.
- Deletes are **soft deletes** (tombstones) until they're synced.
- **Sync engine** (WorkManager, unique periodic work + a one-time job on change, network constraint): **push** pending local changes, then **pull** server changes since `lastSyncTimestamp`.
- **Conflict resolution**: last-write-wins (by server timestamp), version vectors, field-level merges, or a prompt to the user. Choose based on the domain.
- **Idempotent APIs** (the client UUID prevents duplicates on retry).
- The UI shows a sync status indicator. Connectivity is observed through `ConnectivityManager`.

</details>

### 6. Design a file download manager.

<details>
<summary>Answer</summary>

- **Requirements:** parallel downloads with a limit, pause/resume, progress notifications, survive app kill, retry on failure, storage checks.
- **WorkManager** worker per download (unique work by URL), running as **foreground** work with a progress notification for long downloads. On Android 14+, consider **user-initiated data transfer jobs**.
- **Resume**: HTTP `Range: bytes=<downloaded>-` headers, writing to a `.part` file. Persist the progress in Room.
- **Concurrency**: a queue with a max of N parallel downloads (a Semaphore or WorkManager constraints).
- **Integrity**: verify a checksum, then move to the final location (MediaStore for user-visible files).
- **Network policy**: Wi-Fi only (`NetworkType.UNMETERED`) as a user setting.
- **Errors**: exponential backoff, a disk-full check, and expired URLs refreshed from the server.

</details>

### 7. Design an analytics / logging SDK.

<details>
<summary>Answer</summary>

- **API**: `Analytics.track(event, properties)`. Non-blocking, so you never slow down the caller.
- Events go into an **in-memory queue**, which is flushed to a **local DB/file** (so they survive process death).
- **Batch upload** (every N events or T minutes, and on app background) with WorkManager (network constraint, backoff).
- Compress (gzip) the payloads. Cap the storage and drop the oldest events when full. Sample high-volume events.
- Attach common context (app version, OS, device, session ID). Handle privacy: user consent (GDPR), PII scrubbing, an opt-out.
- SDK concerns: **tiny footprint**, minimal dependencies (no conflicts with the host app), lazy initialization (no startup cost), thread safety, R8 consumer rules, a stable public API (binary compatibility).

</details>

### 8. Design a location tracking app (e.g. ride-sharing driver app / fitness tracker).

<details>
<summary>Answer</summary>

- **Fused Location Provider** with a priority and interval that fit the use case (high accuracy during a trip, balanced otherwise).
- Continuous tracking runs in a **foreground service** of type `location`, with a persistent notification. Requires `ACCESS_FINE_LOCATION`, plus background location only if it's truly needed.
- Buffer points in **Room**, and **batch upload** them (every N points or seconds) to save battery and data. Send real-time updates over a WebSocket when the rider needs live tracking.
- Filter noisy points (accuracy threshold, speed sanity checks), and simplify the path (Douglas-Peucker).
- Handle Doze and OEM battery optimizations, the GPS being turned off, and permission revocation.
- Use **geofencing** for arrival detection instead of constant polling.

</details>

### 9. Design a video streaming app (like YouTube/Netflix).

<details>
<summary>Answer</summary>

- **Media3 ExoPlayer** with **adaptive streaming** (HLS/DASH), so the bitrate adapts to bandwidth (ABR).
- **Player lifecycle**: a single player instance; release it in `onStop` (or keep it in a MediaSessionService for background audio); handle audio focus and PiP (`supportsPictureInPicture`).
- **Offline downloads**: `DownloadService` / `DownloadManager` from Media3, with **DRM** (Widevine) license persistence.
- **Feed**: like the news feed design, with prefetched thumbnails and preloaded first segments.
- Resume position stored locally and synced. Analytics: buffering events, startup time, bitrate switches.
- **MediaSession** for notification and lock-screen controls, Android Auto and Wear.

</details>

### 10. What caching strategies exist on mobile?

<details>
<summary>Answer</summary>

- **Cache-first** (stale data OK): show the cache, refresh in the background (stale-while-revalidate).
- **Network-first**: try the network, fall back to the cache when offline (prices, critical data).
- **Cache-only / network-only**.
- **Layers**: memory (LruCache), disk (Room/files), HTTP cache (OkHttp).
- **Invalidation**: TTL, ETags, server push invalidation, version keys. "There are only two hard things in CS: cache invalidation and naming things."

</details>

### 11. Offset vs cursor pagination?

<details>
<summary>Answer</summary>

- **Offset** (`?page=3&size=20`) – simple, but if items are inserted or deleted between requests you get **duplicates or missed items**, and large offsets are slow on the server.
- **Cursor/keyset** (`?after=<lastId or encoded cursor>`) – stable under inserts and efficient. You can't jump to an arbitrary page, which feeds don't need anyway. **Preferred for feeds.**

</details>

### 12. How do you handle real-time updates? (Polling vs WebSocket vs SSE vs push)

<details>
<summary>Answer</summary>

Choose based on frequency and direction: **FCM push** for infrequent events and background wake-ups; **WebSocket** for bidirectional, frequent updates in the foreground (chat, live location); **SSE** for one-way server streams (live scores); **polling** with backoff only as a fallback. Close sockets in the background to save battery. See [Networking Q15](15-networking.md).

</details>

### 13. How do you design for scale in a large codebase (many teams)?

<details>
<summary>Answer</summary>

Modularization by feature with clear API/impl boundaries, a shared design system module, DI per module, convention plugins, ownership (CODEOWNERS), feature flags for trunk-based development, CI with affected-module testing, binary-compatible internal APIs, and documentation/ADRs (Architecture Decision Records).

</details>

### 14. How do you implement feature flags and remote config?

<details>
<summary>Answer</summary>

Use **Firebase Remote Config** (or LaunchDarkly, or an in-house service), with default values bundled in the app. Fetch at startup, apply on the next session to avoid UI jumps, and cache locally. Uses: **kill switches** for broken features, gradual rollouts, A/B tests. Wrap flags behind an interface (`FeatureFlags.isEnabled(Feature.NEW_CHECKOUT)`) so you can test them and override them in a debug menu.

</details>

### 15. What non-functional aspects should you always mention?

<details>
<summary>Answer</summary>

- **Performance**: startup, scrolling, memory.
- **Battery and data**: batching, compression, WorkManager constraints.
- **Offline support and error handling**: retries, empty and error states.
- **Security**: token storage, pinning, PII.
- **Privacy**: permissions, data safety.
- **Accessibility**, **localization** (RTL).
- **Observability**: crash reporting, logging, analytics, performance monitoring.
- **Testability**, and **app size**.
- **Backward compatibility**: API versioning and forced-update mechanisms (a minimum supported app version from the backend).

</details>

---

[⬅ Previous: Build, Gradle & Release](22-build-gradle-release.md) · [⬅ Back to index](../README.md) · [Next: What's New & Trending ➡](24-whats-new-trending.md)
