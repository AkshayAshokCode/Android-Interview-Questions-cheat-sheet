# RxJava

[⬅ Back to index](../README.md)

Covers: reactive basics, Observable types, Schedulers, operators, Subjects, hot vs cold, backpressure, disposal, error handling, migration to Flow. (Still asked often for legacy/large codebases.)

---

### 1. What is RxJava? What is reactive programming?

<details>
<summary>Answer</summary>

**Reactive programming** means programming with **asynchronous data streams**: you declare how data flows and transforms, and you react to events as they arrive (Observer pattern + iterator + functional operators).

**RxJava** is the JVM implementation of ReactiveX. Core parts: **Observable** (source) → **Operators** (transform) → **Observer/Subscriber** (consumer), with **Schedulers** for threading and **Disposables** for cleanup. RxAndroid adds `AndroidSchedulers.mainThread()`.

</details>

### 2. What are the types of Observables?

<details>
<summary>Answer</summary>

| Type | Emits | Use case | Coroutine equivalent |
|---|---|---|---|
| `Observable` | 0..N items, no backpressure | UI events, small streams | `Flow` |
| `Flowable` | 0..N items, **with backpressure** | Large/fast streams (DB, sensors) | `Flow` |
| `Single` | exactly 1 item or error | Network call | `suspend fun(): T` |
| `Maybe` | 0 or 1 item, or error | Cache lookup | `suspend fun(): T?` |
| `Completable` | no item; completes or errors | Save/delete operation | `suspend fun()` |

</details>

### 3. What is the Observer contract?

<details>
<summary>Answer</summary>

`onSubscribe(Disposable)` → `onNext(item)`* → then **either** `onComplete()` **or** `onError(Throwable)`. Nothing comes after a terminal event. `Single` uses `onSuccess` and `onError`.

</details>

### 4. `subscribeOn` vs `observeOn`?

<details>
<summary>Answer</summary>

- **`subscribeOn(Schedulers.io())`** – chooses the thread where the **source starts** (where the subscription happens). Its position in the chain doesn't matter, and **only the first one counts**.
- **`observeOn(AndroidSchedulers.mainThread())`** – switches the thread for every operator **downstream** of it. You can use it multiple times.

```kotlin
api.getUsers()
    .subscribeOn(Schedulers.io())
    .map { it.toDomain() }
    .observeOn(AndroidSchedulers.mainThread())
    .subscribe({ render(it) }, { showError(it) })
```

</details>

### 5. What are Schedulers?

<details>
<summary>Answer</summary>

- `Schedulers.io()` – unbounded cached pool for I/O.
- `Schedulers.computation()` – fixed pool (one thread per CPU core) for CPU work.
- `Schedulers.newThread()`, `Schedulers.single()`, `Schedulers.trampoline()` (current thread, queued; useful in tests), `Schedulers.from(executor)`.
- `AndroidSchedulers.mainThread()` (RxAndroid).

</details>

### 6. `map` vs `flatMap` vs `concatMap` vs `switchMap`?

<details>
<summary>Answer</summary>

- **`map`** – transforms each item 1:1, synchronously.
- **`flatMap`** – maps each item to an Observable and **merges** the results. Runs concurrently, **order not guaranteed**.
- **`concatMap`** – like flatMap but **sequential**: waits for each inner Observable, so **order is preserved**.
- **`switchMap`** – **cancels** the previous inner Observable when a new item arrives. Ideal for **search-as-you-type**.

</details>

### 7. `zip` vs `merge` vs `combineLatest` vs `concat`?

<details>
<summary>Answer</summary>

- **`zip`** – pairs items by index from multiple sources (wait for both API calls, then combine).
- **`merge`** – interleaves emissions from sources as they arrive.
- **`concat`** – subscribes to the sources one after another (cache first, then network).
- **`combineLatest`** – emits whenever any source emits, using the latest from each (form validation).

</details>

### 8. What are Subjects? Explain their types.

<details>
<summary>Answer</summary>

A Subject is both an **Observable and an Observer** (hot). It's used to bridge imperative code into Rx.
- **PublishSubject** – emits only items received **after** subscription.
- **BehaviorSubject** – emits the **latest item** (or a default) on subscribe, then the following ones. Like `StateFlow`.
- **ReplaySubject** – replays **all** (or N) previous items to new subscribers.
- **AsyncSubject** – emits only the **last** value, on completion.

**Relays** (RxRelay) are Subjects that can't terminate, which is safer for UI events.

</details>

### 9. Hot vs cold Observables?

<details>
<summary>Answer</summary>

- **Cold** – starts producing **per subscriber** (each subscription re-runs the source, e.g. a Retrofit call).
- **Hot** – produces regardless of subscribers, and they share the emissions (Subjects, UI clicks).
- Turn cold into hot with `publish().refCount()`, `share()`, `replay(1).autoConnect()`.

</details>

### 10. What is backpressure? How does Flowable handle it?

<details>
<summary>Answer</summary>

Backpressure is the situation where the producer emits faster than the consumer can handle. An `Observable` has no backpressure support, so it risks `OutOfMemoryError`. A `Flowable` uses request-based flow control with strategies: `BackpressureStrategy.BUFFER`, `DROP`, `LATEST`, `ERROR`, `MISSING`, or operators like `onBackpressureDrop()`.

</details>

### 11. What are Disposable and CompositeDisposable? Why are they needed?

<details>
<summary>Answer</summary>

`subscribe()` returns a **`Disposable`**. Calling `dispose()` unsubscribes and stops the work. If you don't dispose, the subscription keeps the Activity alive, which causes **memory leaks** and callbacks on dead views.

```kotlin
private val disposables = CompositeDisposable()
disposables += api.getUsers().subscribe(...)
override fun onCleared() { disposables.clear() }   // in ViewModel
```

`clear()` disposes everything and lets you reuse the container; `dispose()` also makes it reject future additions.

</details>

### 12. How do you handle errors in RxJava?

<details>
<summary>Answer</summary>

- `onErrorReturn { default }`, `onErrorReturnItem(x)`.
- `onErrorResumeNext { fallbackObservable }`.
- `retry(3)`, `retryWhen { errors -> ... }` (backoff).
- `doOnError { log(it) }` for side effects only.
- **Always provide an `onError`** in `subscribe`. Otherwise you get an `OnErrorNotImplementedException` crash.
- Set `RxJavaPlugins.setErrorHandler` for undeliverable exceptions (errors after disposal).

</details>

### 13. What are `debounce`, `throttleFirst`, `distinctUntilChanged`?

<details>
<summary>Answer</summary>

- **`debounce(300ms)`** – emits only after a quiet period (search input).
- **`throttleFirst(1s)`** – emits the first item, then ignores the rest for a window (prevents **double clicks**).
- **`distinctUntilChanged()`** – skips consecutive duplicates.

</details>

### 14. What are `doOnNext`, `doOnSubscribe`, `doFinally`?

<details>
<summary>Answer</summary>

Side-effect operators that don't change the stream: logging, showing or hiding a loader (`doOnSubscribe { showLoading() }`, `doFinally { hideLoading() }`).

</details>

### 15. How do you test RxJava code?

<details>
<summary>Answer</summary>

- `TestObserver`: `observable.test().assertValues(a, b).assertComplete()`.
- Replace schedulers: `RxJavaPlugins.setIoSchedulerHandler { Schedulers.trampoline() }` and `RxAndroidPlugins.setInitMainThreadSchedulerHandler { Schedulers.trampoline() }` (usually in a JUnit rule).
- `TestScheduler` for controlling time (`advanceTimeBy`).

</details>

### 16. RxJava vs Coroutines/Flow – how do you migrate?

<details>
<summary>Answer</summary>

| RxJava | Coroutines |
|---|---|
| `Single<T>` | `suspend fun(): T` |
| `Completable` | `suspend fun()` |
| `Observable`/`Flowable` | `Flow<T>` |
| `BehaviorSubject` | `MutableStateFlow` |
| `PublishSubject` | `MutableSharedFlow` |
| `subscribeOn`/`observeOn` | `flowOn` / `withContext` |
| `CompositeDisposable` | Structured concurrency (scope cancellation) |
| `switchMap` | `flatMapLatest` |

Migrate **incrementally, layer by layer** with `kotlinx-coroutines-rx3` (`.await()`, `.asFlow()`, `rxSingle {}`, `asObservable()`). Start with the data layer or new features.

</details>

---

[⬅ Previous: Threading & Background Work](17-threading-background-work.md) · [⬅ Back to index](../README.md) · [Next: Performance & Memory ➡](19-performance-memory.md)
