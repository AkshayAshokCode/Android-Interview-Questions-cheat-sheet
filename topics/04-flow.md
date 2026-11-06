# Kotlin Flow

[⬅ Back to index](../README.md)

Covers: cold vs hot streams, StateFlow, SharedFlow, operators, lifecycle-aware collection, one-time events, backpressure, testing.

---

### 1. What is Flow?

<details>
<summary>Answer</summary>

`Flow<T>` is an **asynchronous stream** that emits multiple values sequentially, built on coroutines. A `suspend fun` returns **one** value; a `Flow` emits **many** over time.

```kotlin
fun ticker(): Flow<Int> = flow {
    var i = 0
    while (true) { emit(i++); delay(1000) }
}
```

It has three roles: **producer** (`flow {}`, Room, DataStore), optional **intermediaries** (operators), and **consumer** (`collect`).

</details>

### 2. Cold flow vs hot flow?

<details>
<summary>Answer</summary>

| Cold (`flow {}`) | Hot (`StateFlow`, `SharedFlow`, `Channel`) |
|---|---|
| Starts producing **only when collected** | Active regardless of collectors |
| **Each collector** gets its own independent execution | Collectors **share** the same emissions |
| Stops when the collector is cancelled | Keeps living in its scope |

Example: a Retrofit call wrapped in `flow {}` runs again for each collector. A `StateFlow` in the ViewModel holds one shared state.

</details>

### 3. What is StateFlow?

<details>
<summary>Answer</summary>

A **hot** flow that always holds a **current value** (`.value`). Ideal for **UI state**.
- It must have an **initial value**.
- New collectors **immediately get the latest value**.
- It is **conflated**: fast updates can skip intermediate values; collectors always see the latest.
- It uses **`distinctUntilChanged`** semantics: setting a value equal to the current one doesn't emit.

```kotlin
private val _uiState = MutableStateFlow(UiState())
val uiState: StateFlow<UiState> = _uiState.asStateFlow()

fun onNameChanged(n: String) = _uiState.update { it.copy(name = n) }  // atomic
```

Use `update {}` instead of `value = value.copy()` to avoid race conditions.

</details>

### 4. What is SharedFlow?

<details>
<summary>Answer</summary>

A configurable **hot** flow that broadcasts values to **all** collectors. It has no required initial value.

```kotlin
MutableSharedFlow<Event>(
    replay = 0,                 // how many past values new collectors get
    extraBufferCapacity = 1,    // buffer beyond replay
    onBufferOverflow = BufferOverflow.DROP_OLDEST
)
```

`StateFlow` is essentially a `SharedFlow(replay = 1)` + conflation + distinctUntilChanged + a required value.

</details>

### 5. StateFlow vs SharedFlow vs LiveData?

<details>
<summary>Answer</summary>

| | LiveData | StateFlow | SharedFlow |
|---|---|---|---|
| Initial value | Optional | **Required** | None |
| Lifecycle-aware | **Yes** (built-in) | No – use `repeatOnLifecycle` / `collectAsStateWithLifecycle` | No |
| Operators | Few (`map`, `switchMap`) | Full Flow operators | Full |
| Threading | `postValue` from any thread | Thread-safe, any thread | Thread-safe |
| Equality check | No (emits same value again) | Yes (`distinctUntilChanged`) | No |
| Platform | Android only | Pure Kotlin (testable, KMP) | Pure Kotlin |
| Use for | Legacy UI state | **UI state** | **Events / broadcasts** |

</details>

### 6. How should you collect flows in the UI safely?

<details>
<summary>Answer</summary>

Never use a bare `lifecycleScope.launch { flow.collect {} }`. It keeps collecting while the app is in the background, which wastes resources and can crash on view access.

**Views:**
```kotlin
viewLifecycleOwner.lifecycleScope.launch {
    viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.uiState.collect { render(it) }
    }
}
```
`repeatOnLifecycle` starts collecting on `STARTED` and **cancels on `STOPPED`**, then restarts.

**Compose:**
```kotlin
val state by viewModel.uiState.collectAsStateWithLifecycle()
```

`launchWhenStarted` is **deprecated**: it only *paused* the coroutine while the upstream kept producing.

</details>

### 7. What are `stateIn` and `shareIn`? What is `WhileSubscribed(5000)`?

<details>
<summary>Answer</summary>

They convert a **cold** flow into a **hot** StateFlow or SharedFlow, so that multiple collectors share one upstream:

```kotlin
val uiState: StateFlow<UiState> = repo.observeItems()
    .map { UiState.Success(it) }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), UiState.Loading)
```

`SharingStarted` strategies:
- **`WhileSubscribed(5000)`** – keeps the upstream alive for 5 s after the last collector leaves. That's enough to **survive a configuration change** (rotation) without restarting, while still stopping when the app goes to the background. This is the recommended default.
- `Eagerly` – starts immediately and never stops.
- `Lazily` – starts on the first collector and never stops.

</details>

### 8. How do you handle one-time events (navigation, snackbar) from a ViewModel?

<details>
<summary>Answer</summary>

Options:
1. **`Channel` + `receiveAsFlow()`** – each event goes to one collector and is buffered while nobody is collecting. Common choice.
2. **`SharedFlow(replay = 0)`** – events are **lost** if there are no collectors at the time (e.g. during rotation).
3. **Google's current recommendation:** model events **as state** (e.g. `uiState.userMessage: String?`). The UI acts on it, then calls `viewModel.messageShown()` to clear it. This is the most reliable option and survives process death if you save it.

Avoid `SingleLiveEvent`; it's a hack.

</details>

### 9. Explain common Flow operators.

<details>
<summary>Answer</summary>

- **Transform:** `map`, `filter`, `transform`, `mapNotNull`, `scan` (running accumulation).
- **Side effects:** `onEach`, `onStart`, `onCompletion`, `onEmpty`.
- **Combine:** `combine` (latest of each flow, whenever any emits), `zip` (pairs values 1-to-1), `merge` (interleaves emissions).
- **Flattening:** `flatMapConcat` (sequential), `flatMapMerge` (concurrent), `flatMapLatest` (cancels the previous inner flow).
- **Rate limiting:** `debounce`, `sample`, `distinctUntilChanged`.
- **Terminal:** `collect`, `first`, `toList`, `single`, `reduce`, `fold`, `launchIn(scope)`.
- **Errors:** `catch`, `retry`, `retryWhen`.
- **Context:** `flowOn`, `buffer`, `conflate`.

</details>

### 10. `combine` vs `zip`?

<details>
<summary>Answer</summary>

- **`zip`** – pairs the 1st value with the 1st, the 2nd with the 2nd… It waits for both flows, and stops when either completes.
- **`combine`** – emits whenever **any** flow emits, using the **latest** value from each (after each has emitted at least once). Used to merge multiple state sources into a UI state:

```kotlin
combine(userFlow, settingsFlow, cartFlow) { u, s, c -> UiState(u, s, c) }
```

</details>

### 11. `flatMapLatest` vs `flatMapConcat` vs `flatMapMerge`?

<details>
<summary>Answer</summary>

- **`flatMapLatest`** – when a new value arrives, it **cancels** the previous inner flow. Perfect for **search**:
  ```kotlin
  queryFlow.debounce(300).distinctUntilChanged()
      .flatMapLatest { q -> repo.search(q) }
  ```
- **`flatMapConcat`** – processes inner flows one after another, in order.
- **`flatMapMerge(concurrency)`** – runs inner flows concurrently; emissions are interleaved.

</details>

### 12. What does `flowOn` do? What is context preservation?

<details>
<summary>Answer</summary>

`flowOn(Dispatchers.IO)` changes the dispatcher of the **upstream** operators (everything before it). The collector keeps running in its own context.

**Context preservation:** you can't call `emit` from a different context inside `flow {}` (for example with `withContext(IO) { emit(x) }`). That throws `IllegalStateException`. Use `flowOn`, or use `channelFlow` when you need to emit from several coroutines.

</details>

### 13. How do you handle errors in a Flow?

<details>
<summary>Answer</summary>

- **`catch {}`** – catches exceptions from **upstream** only. You can emit a fallback value: `.catch { emit(UiState.Error(it.message)) }`.
- **`retry(3) { it is IOException }`** / **`retryWhen`** – re-subscribe, with backoff if you want.
- Exceptions in the **collector** aren't caught by `catch`. Use `onEach { }` + `catch` + `launchIn`, or a `try/catch` around `collect`.
- A Flow that throws **completes**; it doesn't continue. To keep listening, wrap each item's processing in error handling.

</details>

### 14. What is backpressure? How do `buffer`, `conflate`, `collectLatest` help?

<details>
<summary>Answer</summary>

Backpressure is what happens when the producer is faster than the consumer. By default Flow is **sequential**: `emit` suspends until the collector has processed the value, so the backpressure is natural.
- **`buffer()`** – producer and consumer run in separate coroutines with a queue between them.
- **`conflate()`** – keeps only the **latest** value; intermediate values are dropped.
- **`collectLatest {}`** – if a new value arrives, **cancels** processing of the previous one.

</details>

### 15. What are `callbackFlow` and `channelFlow`?

<details>
<summary>Answer</summary>

Builders that let you emit from **callbacks or other coroutines**:

```kotlin
fun locationUpdates(): Flow<Location> = callbackFlow {
    val cb = object : LocationCallback() {
        override fun onLocationResult(r: LocationResult) { trySend(r.lastLocation) }
    }
    client.requestLocationUpdates(request, cb, Looper.getMainLooper())
    awaitClose { client.removeLocationUpdates(cb) }   // mandatory cleanup
}
```

`awaitClose` keeps the flow alive and runs the cleanup when the collector cancels.

</details>

### 16. Is StateFlow emission lossy? Why might the UI miss updates?

<details>
<summary>Answer</summary>

Yes. StateFlow is **conflated**: if you set values A → B → C quickly, a slow collector may only see C. It also **ignores equal values**, so setting the same object again doesn't trigger a collection. That's fine for **state** (only the latest matters), but wrong for **events**. Use a Channel or SharedFlow for events, and use immutable `data class` copies for state.

</details>

### 17. How do Room/DataStore use Flow?

<details>
<summary>Answer</summary>

- Room DAO: `@Query("SELECT * FROM user") fun observeUsers(): Flow<List<User>>` re-emits automatically whenever the table changes. It's the **single source of truth** for offline-first apps.
- DataStore: `dataStore.data: Flow<Preferences>`.

</details>

### 18. How do you test a Flow?

<details>
<summary>Answer</summary>

- Simple: `flow.first()`, `flow.take(3).toList()` inside `runTest`.
- **Turbine** (recommended):
```kotlin
viewModel.uiState.test {
    assertEquals(UiState.Loading, awaitItem())
    assertEquals(UiState.Success(data), awaitItem())
    cancelAndIgnoreRemainingEvents()
}
```
- For `stateIn(WhileSubscribed)`, the flow needs an active collector in the test (e.g. `backgroundScope.launch { vm.state.collect() }`).

</details>

### 19. What is the difference between `collect` and `launchIn`?

<details>
<summary>Answer</summary>

`collect` is a suspending terminal operator: it blocks the current coroutine until the flow completes. `flow.onEach { }.launchIn(scope)` starts collection in a **new coroutine** and returns a `Job`. This is handy for starting several collectors without nested `launch` blocks.

</details>

### 20. Implement a search with debounce using Flow.

<details>
<summary>Answer</summary>

```kotlin
class SearchViewModel(private val repo: SearchRepo) : ViewModel() {
    private val query = MutableStateFlow("")

    val results: StateFlow<SearchUi> = query
        .debounce(300)
        .map { it.trim() }
        .distinctUntilChanged()
        .flatMapLatest { q ->
            if (q.isBlank()) flowOf(SearchUi.Idle)
            else flow { emit(SearchUi.Loading); emit(SearchUi.Results(repo.search(q))) }
                .catch { emit(SearchUi.Error(it.message)) }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), SearchUi.Idle)

    fun onQueryChange(q: String) { query.value = q }
}
```

</details>

---

[⬅ Previous: Coroutines](03-coroutines.md) · [⬅ Back to index](../README.md) · [Next: Java for Android ➡](05-java.md)
