# Kotlin Coroutines

[⬅ Back to index](../README.md)

Covers: basics, builders, dispatchers, scopes & structured concurrency, Job/SupervisorJob, cancellation, exception handling, Android scopes, testing, internals.

---

## Basics

### 1. What is a coroutine?

<details>
<summary>Answer</summary>

A coroutine is a **suspendable computation**: a lightweight unit of work that can pause (suspend) without blocking a thread and resume later, possibly on another thread. Thousands of coroutines can run on a few threads. You write async code in a **sequential style**, with no callbacks.

```kotlin
viewModelScope.launch {
    val user = repo.getUser()      // suspends, doesn't block main thread
    _state.value = UiState.Success(user)
}
```

</details>

### 2. Coroutines vs threads?

<details>
<summary>Answer</summary>

| Threads | Coroutines |
|---|---|
| Managed by the OS; ~1 MB stack each | Managed by the Kotlin runtime; just objects on the heap |
| Expensive to create and context-switch | Very cheap; 100k coroutines is fine |
| Blocking: a waiting thread is wasted | Suspending: the thread is freed while waiting |
| Manual cancellation is hard | Built-in cooperative cancellation |
| No structure | **Structured concurrency**: parent/child lifecycle |

Coroutines **run on** threads (through dispatchers). They don't replace threads.

</details>

### 3. What is a `suspend` function? How does it work internally?

<details>
<summary>Answer</summary>

A function that can **pause and resume**. It can only be called from another suspend function or a coroutine.

**Internally (CPS – Continuation Passing Style):** the compiler adds a hidden `Continuation` parameter and turns the function body into a **state machine**. Each suspension point is a state (a `label`). When the function suspends, it returns the special marker `COROUTINE_SUSPENDED`. Later, `continuation.resumeWith(result)` re-enters the state machine at the saved label, with local variables kept in the continuation object.

```kotlin
suspend fun getUser(): User
// compiles roughly to:
fun getUser(cont: Continuation<User>): Any?   // returns User or COROUTINE_SUSPENDED
```

`suspend` **doesn't** move work to a background thread on its own. Blocking code inside a suspend function still blocks. Use `withContext(Dispatchers.IO)`.

</details>

### 4. What is the difference between `launch` and `async`?

<details>
<summary>Answer</summary>

| `launch` | `async` |
|---|---|
| Fire-and-forget | Computes a result |
| Returns `Job` | Returns `Deferred<T>` (a `Job` with a result) |
| Exceptions propagate immediately to the parent / handler | Exceptions are thrown on `await()` (and still propagate to the parent if it's a child in a regular scope) |

```kotlin
coroutineScope {
    val a = async { api.getProfile() }
    val b = async { api.getPosts() }
    show(a.await(), b.await())   // parallel calls
}
```

</details>

### 5. What is `runBlocking`? When to use it?

<details>
<summary>Answer</summary>

`runBlocking` starts a coroutine and **blocks the current thread** until it finishes. It bridges blocking and suspending code. Use it **only** in `main()` functions or legacy tests. **Never on the Android main thread** (it can cause an ANR). For tests, use `runTest`.

</details>

### 6. What is `withContext`?

<details>
<summary>Answer</summary>

`withContext` switches the coroutine context (usually the dispatcher) for a block, **suspends until the block finishes**, and returns its result. Use it for main-safe functions:

```kotlin
suspend fun readFile(): String = withContext(Dispatchers.IO) { file.readText() }
```

`withContext` vs `async{}.await()`: same result for a single task, but `withContext` is clearer and cheaper. Use `async` only for **parallel** work.

</details>

---

## Dispatchers & Context

### 7. What are dispatchers? Explain each.

<details>
<summary>Answer</summary>

A dispatcher decides **which thread(s)** a coroutine runs on.
- **`Dispatchers.Main`** – the Android UI thread. Use it for UI updates. `Main.immediate` runs straight away if you're already on main, skipping a re-dispatch.
- **`Dispatchers.IO`** – blocking I/O (network, disk, DB). Elastic pool of up to 64 threads (or the number of cores, if higher).
- **`Dispatchers.Default`** – CPU-intensive work (sorting, JSON parsing, image processing). Pool size = number of CPU cores.
- **`Dispatchers.Unconfined`** – starts in the caller's thread and resumes in whatever thread resumed it. Rarely used; mostly for tests or special cases.

IO and Default **share threads**, so switching between them is often free. `Dispatchers.IO.limitedParallelism(n)` creates a view with limited concurrency.

</details>

### 8. What is `CoroutineContext`?

<details>
<summary>Answer</summary>

An indexed set of elements that define how a coroutine behaves:
- **`Job`** – lifecycle and cancellation.
- **`CoroutineDispatcher`** – threading.
- **`CoroutineName`** – for debugging.
- **`CoroutineExceptionHandler`** – handles uncaught exceptions.

Elements are combined with `+`: `Dispatchers.IO + SupervisorJob() + CoroutineName("sync")`. A child coroutine inherits the parent's context, but always gets its **own new `Job`**, which is a child of the parent's Job.

</details>

### 9. Should a repository function decide the dispatcher? (Main-safety)

<details>
<summary>Answer</summary>

Yes. Google recommends that **suspend functions be main-safe**: the class doing blocking work (repository or data source) switches to IO/Default itself with `withContext`. Callers like the ViewModel can then call it from Main. **Inject dispatchers** (don't hardcode `Dispatchers.IO`) so tests can swap in a `TestDispatcher`.

</details>

---

## Scopes & Structured Concurrency

### 10. What is `CoroutineScope`? What is structured concurrency?

<details>
<summary>Answer</summary>

A `CoroutineScope` defines the **lifetime** of the coroutines started in it. **Structured concurrency** means:
1. Every coroutine is launched in a scope, so it **can't leak**.
2. A parent **waits** for all its children to complete.
3. **Cancelling** the parent cancels all its children.
4. A **failing child** cancels the parent and its siblings (with a regular `Job`), and the error isn't lost.

</details>

### 11. What are `viewModelScope`, `lifecycleScope`, `GlobalScope`?

<details>
<summary>Answer</summary>

- **`viewModelScope`** – cancelled in `ViewModel.onCleared()`. Uses `SupervisorJob + Dispatchers.Main.immediate`. Use it for most business logic.
- **`lifecycleScope`** – tied to an Activity/Fragment lifecycle and cancelled on `DESTROYED`. In Fragments, use `viewLifecycleOwner.lifecycleScope` for anything that touches views.
- **`GlobalScope`** – lives as long as the app, with **no structured concurrency**. Avoid it (risk of leaks, untestable). For app-wide work, inject a custom application scope: `CoroutineScope(SupervisorJob() + Dispatchers.Default)`.
- **`rememberCoroutineScope()`** / **`LaunchedEffect`** in Compose.

</details>

### 12. What is the difference between `coroutineScope` and `supervisorScope`?

<details>
<summary>Answer</summary>

Both are suspending builders that create a child scope and wait for all children.
- **`coroutineScope`** – if **any child fails**, all other children are cancelled and the exception is rethrown. "All or nothing."
- **`supervisorScope`** – a child's failure **doesn't affect siblings or the parent**. Each child handles its own errors (with `try/catch` in the child or a `CoroutineExceptionHandler`).

Example: loading several independent dashboard widgets → `supervisorScope`. Loading data that all has to succeed → `coroutineScope`.

</details>

### 13. What is `Job` vs `SupervisorJob`?

<details>
<summary>Answer</summary>

- **`Job`** – a child failure cancels the parent, which cancels all other children.
- **`SupervisorJob`** – children fail independently; the failure doesn't propagate upward.

⚠️ A common mistake: `launch(SupervisorJob()) { launch { throw X } }` does **not** supervise the inner launch. Passing a Job to a builder makes it the *parent* of the new coroutine, which breaks structured concurrency. Use `supervisorScope {}` or a scope built with `SupervisorJob` instead.

</details>

### 14. What are the states of a Job?

<details>
<summary>Answer</summary>

`New` → `Active` → `Completing` (waiting for children) → `Completed`.
On cancellation or failure: `Active` → `Cancelling` → `Cancelled`.
Properties: `isActive`, `isCompleted`, `isCancelled`. `job.join()` waits for completion, and `job.cancelAndJoin()` cancels and waits. `launch(start = CoroutineStart.LAZY)` creates a job in the `New` state that starts on `start()`/`join()`.

</details>

---

## Cancellation

### 15. How does coroutine cancellation work? What does "cooperative" mean?

<details>
<summary>Answer</summary>

`job.cancel()` marks the job as cancelled, but the code has to **cooperate** by checking for cancellation. All suspending functions from `kotlinx.coroutines` (`delay`, `withContext`, `yield`, Flow operators…) check it and throw **`CancellationException`**.

A CPU-bound loop without suspension points **won't stop**. Make it cooperative:

```kotlin
while (isActive) { ... }          // or
ensureActive()                    // throws if cancelled
yield()                           // checks + gives other coroutines a turn
```

</details>

### 16. Why must you not swallow `CancellationException`?

<details>
<summary>Answer</summary>

`CancellationException` is how cancellation travels through the coroutine. If you `catch (e: Exception)` and don't rethrow it, the coroutine **keeps running even though it was cancelled**, which can leak work and break structured concurrency.

```kotlin
try { api.call() }
catch (e: CancellationException) { throw e }
catch (e: Exception) { showError(e) }
```

</details>

### 17. How do you run cleanup code in a cancelled coroutine?

<details>
<summary>Answer</summary>

Use `try { } finally { }`. If the cleanup itself needs to **suspend** (e.g. close a connection), wrap it in `withContext(NonCancellable) { }`. A cancelled coroutine can't suspend otherwise.

</details>

### 18. What are `withTimeout` and `withTimeoutOrNull`?

<details>
<summary>Answer</summary>

`withTimeout(5000) { }` throws `TimeoutCancellationException` when time runs out. `withTimeoutOrNull` returns `null` instead, which is usually easier to handle.

</details>

---

## Exception Handling

### 19. How are exceptions handled in coroutines?

<details>
<summary>Answer</summary>

- **`launch`** – an uncaught exception propagates **up to the parent** and cancels it (unless there's a supervisor). At the root, it goes to the `CoroutineExceptionHandler`, or crashes the app if there's none.
- **`async`** – the exception is stored and **thrown when you call `await()`**. If the `async` is a child of a regular Job, it **also** propagates to the parent immediately.
- `try/catch` **around `launch {}` doesn't work**, because launch returns immediately. Put the try/catch **inside** the coroutine.

</details>

### 20. What is `CoroutineExceptionHandler`? Where does it work?

<details>
<summary>Answer</summary>

It's a context element that handles **uncaught** exceptions. It **only works on root coroutines** (launched directly in a scope) or on direct children of a `supervisorScope`/`SupervisorJob`. Installed on an inner child, it is ignored, because the exception goes to the parent. It has no effect on `async` (which surfaces exceptions through `await`). Use it as a last-resort logger, not as normal flow control.

```kotlin
val handler = CoroutineExceptionHandler { _, e -> log(e) }
scope.launch(handler) { ... }
```

</details>

### 21. What happens if multiple children fail?

<details>
<summary>Answer</summary>

The **first** exception wins and is propagated. The others are attached to it as **suppressed** exceptions (`exception.suppressed`).

</details>

---

## Android & Practical

### 22. How do you run network calls in parallel and combine results?

<details>
<summary>Answer</summary>

```kotlin
suspend fun loadDashboard() = coroutineScope {
    val user = async { userRepo.get() }
    val feed = async { feedRepo.get() }
    Dashboard(user.await(), feed.await())
}
```

For a list: `ids.map { async { api.get(it) } }.awaitAll()`. To limit concurrency, use a `Semaphore` (`withPermit`) or `Dispatchers.IO.limitedParallelism(4)`.

</details>

### 23. How to convert a callback-based API to a suspend function?

<details>
<summary>Answer</summary>

Use `suspendCancellableCoroutine`:

```kotlin
suspend fun FusedLocationProviderClient.awaitLocation(): Location =
    suspendCancellableCoroutine { cont ->
        lastLocation
            .addOnSuccessListener { cont.resume(it) }
            .addOnFailureListener { cont.resumeWithException(it) }
        cont.invokeOnCancellation { /* cancel request */ }
    }
```

For **multiple** values (listeners), use `callbackFlow` with `awaitClose { unregister() }`.

</details>

### 24. What are `Mutex` and `Semaphore` in coroutines?

<details>
<summary>Answer</summary>

- **`Mutex`** – mutual exclusion for coroutines: `mutex.withLock { counter++ }`. It **suspends** instead of blocking the thread, unlike `synchronized`. Not reentrant.
- **`Semaphore(n)`** – limits concurrency to `n` permits: `semaphore.withPermit { download() }`.
- Alternatives: atomic classes, confining state to a single thread (`limitedParallelism(1)`), or actors/channels.

</details>

### 25. What are Channels? Channel vs Flow?

<details>
<summary>Answer</summary>

A **Channel** is a **hot**, coroutine-safe queue (`send`/`receive`) for communication between coroutines. Each value is received by **one** consumer.
Types: `RENDEZVOUS` (default, no buffer), `BUFFERED`, `CONFLATED` (keeps only the latest), `UNLIMITED`.

- **Channel** – hot, values exist whether or not anyone is collecting; good for one-to-one events (`receiveAsFlow()` for one-time UI events).
- **Flow** – **cold**, a stream that starts on collection; supports many operators.

</details>

### 26. What is `yield()` and `delay()` vs `Thread.sleep()`?

<details>
<summary>Answer</summary>

- `delay()` **suspends**: it frees the thread and is cancellable.
- `Thread.sleep()` **blocks** the thread. Never use it inside coroutines on Main.
- `yield()` gives other coroutines on the same dispatcher a chance to run, and checks for cancellation.

</details>

### 27. How do you test coroutines?

<details>
<summary>Answer</summary>

- `runTest { }` from `kotlinx-coroutines-test` uses **virtual time**, so `delay` is skipped instantly.
- `StandardTestDispatcher` queues tasks (advance with `advanceUntilIdle()` / `advanceTimeBy()`). `UnconfinedTestDispatcher` runs tasks eagerly.
- Replace Main with `Dispatchers.setMain(testDispatcher)` (usually in a JUnit rule) and call `resetMain()` afterwards.
- Inject dispatchers into your classes so tests can pass the test dispatcher.
- Use **Turbine** to test Flows.

</details>

### 28. Coroutines vs RxJava?

<details>
<summary>Answer</summary>

- Coroutines are part of the language and have a **simpler mental model** (sequential code), structured concurrency, and built-in cancellation. Flow covers most Rx use cases.
- RxJava has a huge operator set and is mature, but it has a steep learning curve, it's easy to leak (`Disposable`s), and stack traces are hard to read.
- Modern Android (Jetpack, Room, Retrofit, Compose) is **coroutines/Flow-first**. Interop: `kotlinx-coroutines-rx3` (`asFlow()`, `rxSingle {}`).

</details>

### 29. What is the output? (Classic ordering question)

<details>
<summary>Answer</summary>

```kotlin
fun main() = runBlocking {
    launch { delay(100); println("A") }
    println("B")
    coroutineScope { launch { delay(50); println("C") } }
    println("D")
}
// B, C, D, A
```

`launch` doesn't block, so "B" prints first. `coroutineScope` suspends until its child prints "C", then "D" prints. "A" prints last, after its 100 ms delay.

</details>

### 30. Can you start a coroutine from a non-suspending context in an Activity? What scope do you use for work that must outlive the screen?

<details>
<summary>Answer</summary>

Inside an Activity, use `lifecycleScope.launch {}`. For work that must **survive the screen** (e.g. uploading a file the user expects to finish):
- Short-lived but must not be cancelled with the ViewModel: an injected **application scope** (`@ApplicationScope CoroutineScope`).
- Must be **guaranteed** even if the app is killed: **WorkManager** (a `CoroutineWorker`).

</details>

---

[⬅ Previous: Kotlin Advanced](02-kotlin-advanced.md) · [⬅ Back to index](../README.md) · [Next: Kotlin Flow ➡](04-flow.md)
