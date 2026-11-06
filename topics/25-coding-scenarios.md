# Coding, Scenario & Behavioral Questions

[⬅ Back to index](../README.md)

Covers: Android-flavoured coding problems frequently asked in machine-coding rounds, debugging scenarios, and behavioral / project questions.

---

## Coding Problems

### 1. Implement an LRU cache.

<details>
<summary>Answer</summary>

**Using LinkedHashMap (quick answer):**
```kotlin
class LruCache<K, V>(private val capacity: Int) {
    private val map = object : LinkedHashMap<K, V>(capacity, 0.75f, true) {   // accessOrder = true
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<K, V>) = size > capacity
    }
    @Synchronized fun get(key: K): V? = map[key]
    @Synchronized fun put(key: K, value: V) { map[key] = value }
}
```

**From scratch (HashMap + doubly linked list, O(1)):**
```kotlin
class LRUCache(private val capacity: Int) {
    private class Node(val key: Int, var value: Int) { var prev: Node? = null; var next: Node? = null }
    private val map = HashMap<Int, Node>()
    private val head = Node(0, 0); private val tail = Node(0, 0)
    init { head.next = tail; tail.prev = head }

    fun get(key: Int): Int {
        val node = map[key] ?: return -1
        remove(node); addFirst(node)
        return node.value
    }
    fun put(key: Int, value: Int) {
        map[key]?.let { remove(it) }
        val node = Node(key, value)
        addFirst(node); map[key] = node
        if (map.size > capacity) { val lru = tail.prev!!; remove(lru); map.remove(lru.key) }
    }
    private fun remove(n: Node) { n.prev!!.next = n.next; n.next!!.prev = n.prev }
    private fun addFirst(n: Node) { n.next = head.next; n.prev = head; head.next!!.prev = n; head.next = n }
}
```

</details>

### 2. Implement a debounced search.

<details>
<summary>Answer</summary>

With Flow (preferred) – see [Flow Q20](04-flow.md). With plain coroutines:

```kotlin
class SearchViewModel(private val repo: Repo) : ViewModel() {
    private var searchJob: Job? = null
    fun onQueryChanged(query: String) {
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(300)                       // debounce
            _state.value = UiState.Loading
            _state.value = runCatching { repo.search(query) }
                .fold({ UiState.Success(it) }, { UiState.Error(it.message) })
        }
    }
}
```

</details>

### 3. Prevent double clicks on a button.

<details>
<summary>Answer</summary>

```kotlin
fun View.setOnSingleClickListener(interval: Long = 600L, onClick: (View) -> Unit) {
    var lastClick = 0L
    setOnClickListener {
        val now = SystemClock.elapsedRealtime()
        if (now - lastClick >= interval) { lastClick = now; onClick(it) }
    }
}
```

Also disable the button while the request is in flight (`isEnabled = !state.isLoading`). That's the state-driven approach.

</details>

### 4. Make parallel API calls and combine the results; handle partial failure.

<details>
<summary>Answer</summary>

```kotlin
suspend fun loadHome(): HomeData = supervisorScope {
    val banners = async { runCatching { api.banners() }.getOrDefault(emptyList()) }
    val products = async { api.products() }          // required — failure propagates
    HomeData(banners.await(), products.await())
}
```

`supervisorScope` + `runCatching` on the optional calls means a failing banner request doesn't cancel the product request.

</details>

### 5. Implement retry with exponential backoff.

<details>
<summary>Answer</summary>

See [Networking Q9](15-networking.md). Mention **jitter**, retrying only **transient** errors, a **max attempts** limit, and **respecting cancellation**.

</details>

### 6. Write a thread-safe singleton in Kotlin with a parameter (e.g. Context).

<details>
<summary>Answer</summary>

```kotlin
class AppDatabase private constructor(context: Context) {
    companion object {
        @Volatile private var INSTANCE: AppDatabase? = null
        fun getInstance(context: Context): AppDatabase =
            INSTANCE ?: synchronized(this) {
                INSTANCE ?: AppDatabase(context.applicationContext).also { INSTANCE = it }
            }
    }
}
```

Use `applicationContext` to avoid leaks. In real apps, prefer Hilt `@Singleton`.

</details>

### 7. Convert a callback API to a coroutine / Flow.

<details>
<summary>Answer</summary>

`suspendCancellableCoroutine` for single results ([Coroutines Q23](03-coroutines.md)), `callbackFlow` + `awaitClose` for streams ([Flow Q15](04-flow.md)).

</details>

### 8. Implement a simple in-memory cache with TTL in a repository.

<details>
<summary>Answer</summary>

```kotlin
class UserRepository(private val api: UserApi, private val clock: () -> Long = System::currentTimeMillis) {
    private data class Entry(val user: User, val time: Long)
    private val cache = mutableMapOf<String, Entry>()
    private val mutex = Mutex()
    private val ttl = 5 * 60_000L

    suspend fun getUser(id: String, forceRefresh: Boolean = false): User = mutex.withLock {
        val cached = cache[id]
        if (!forceRefresh && cached != null && clock() - cached.time < ttl) return cached.user
        api.getUser(id).also { cache[id] = Entry(it, clock()) }
    }
}
```

Points to mention: an injectable clock (testability), a `Mutex` for thread safety, and TTL-based invalidation. Holding the lock during the network call serializes requests; for a production version, deduplicate in-flight requests per ID instead.

</details>

### 9. Build a countdown timer that survives rotation.

<details>
<summary>Answer</summary>

```kotlin
class TimerViewModel(private val savedState: SavedStateHandle) : ViewModel() {
    val remaining = savedState.getStateFlow("remaining", 60)
    private var job: Job? = null
    fun start() {
        job?.cancel()
        job = viewModelScope.launch {
            while (remaining.value > 0) { delay(1000); savedState["remaining"] = remaining.value - 1 }
        }
    }
}
```

The ViewModel survives rotation and `SavedStateHandle` survives process death. For accuracy, store the end timestamp and compute the remaining time from it, instead of decrementing a counter.

</details>

### 10. Implement pagination manually in a ViewModel.

<details>
<summary>Answer</summary>

```kotlin
class ListViewModel(private val repo: Repo) : ViewModel() {
    private val _state = MutableStateFlow(ListState())
    val state = _state.asStateFlow()
    private var page = 1
    private var isLoading = false
    private var endReached = false

    fun loadNext() {
        if (isLoading || endReached) return
        isLoading = true
        viewModelScope.launch {
            _state.update { it.copy(isLoadingMore = true) }
            runCatching { repo.getItems(page, 20) }
                .onSuccess { items ->
                    endReached = items.isEmpty()
                    page++
                    _state.update { it.copy(items = it.items + items, isLoadingMore = false) }
                }
                .onFailure { e -> _state.update { it.copy(isLoadingMore = false, error = e.message) } }
            isLoading = false
        }
    }
}
```

Trigger `loadNext()` when the last visible item is within a threshold of the end. In real apps, mention **Paging 3**.

</details>

### 11. Find the bug: why does this crash or leak?

<details>
<summary>Answer</summary>

```kotlin
class MyFragment : Fragment(R.layout.f) {
    private lateinit var binding: FBinding
    override fun onViewCreated(v: View, s: Bundle?) {
        binding = FBinding.bind(v)
        viewModel.data.observe(this) { binding.text.text = it }            // ❌ 1
        lifecycleScope.launch { viewModel.flow.collect { binding.x = it } } // ❌ 2
    }
}
```

1. Observing with `this` instead of `viewLifecycleOwner` means observers pile up after the view is recreated, and they update a destroyed view.
2. The flow is collected outside `repeatOnLifecycle`, so it keeps collecting in the background, and it uses the fragment's scope instead of the view's.
3. The binding is never cleared in `onDestroyView`, which leaks the view hierarchy while the fragment is on the back stack.

</details>

### 12. Common Kotlin output questions.

<details>
<summary>Answer</summary>

```kotlin
val list = listOf(1, 2, 3)
list.forEach { if (it == 2) return@forEach; print(it) }   // prints 13
```

```kotlin
data class A(val x: Int) { var y = 0 }
val a1 = A(1).apply { y = 5 }; val a2 = A(1)
println(a1 == a2)   // true – body properties excluded from equals
```

```kotlin
val s1 = "abc"; val s2 = "abc"
println(s1 === s2)  // true – string pool
```

```kotlin
println(listOf(1,2,3).asSequence().map { print("m$it "); it * 2 }.first())  // m1 2 (lazy)
```

</details>

### 13. Other frequently asked DSA problems for Android roles.

<details>
<summary>Answer</summary>

Practice these in Kotlin: two-sum, valid parentheses, reverse a linked list, detect a cycle, merge intervals, top-K frequent elements (heap), BFS/DFS on a grid (number of islands), binary search variants, longest substring without repeating characters (sliding window), group anagrams, LRU cache, implementing a min-stack, flattening a nested list, and string compression. Know the time and space complexity of each.

</details>

---

## Scenario / Debugging Questions

### 14. The app is slow on startup. How do you investigate?

<details>
<summary>Answer</summary>

1. **Measure**: the `Displayed` time in Logcat, Macrobenchmark `StartupTimingMetric`, Play vitals.
2. **Trace**: a Perfetto/system trace of startup. Look at `bindApplication`, `activityStart`, `inflate`, and long main-thread slices.
3. **Common culprits**: heavy `Application.onCreate` (SDK inits), eager DI graphs, disk I/O on the main thread (SharedPreferences, DB), complex first layouts, network calls before the first frame.
4. **Fix**: lazy or background init, App Startup, a Baseline Profile, a simpler first frame with async content, R8.
5. **Verify** with benchmarks in release builds.

</details>

### 15. Users report crashes you can't reproduce. What do you do?

<details>
<summary>Answer</summary>

Check Crashlytics or Play vitals: the stack trace, device/OS distribution, app version, breadcrumbs and custom keys. Look for patterns (a specific OEM, Android version, low memory, process death). Try to reproduce with **"Don't keep activities"**, `am kill`, a slow network, rotation, and low-memory devices. Add logging or keys, then fix with a test and ship behind a staged rollout.

</details>

### 16. The list scrolls with jank. How do you fix it?

<details>
<summary>Answer</summary>

Profile it (Perfetto, JankStats, Layout Inspector recomposition counts). Check for: work in `onBindViewHolder` or in the composable body, full-size image decoding, a missing DiffUtil or keys, nested weights or deep hierarchies, allocations during scroll, and unstable Compose parameters. Fix those, add a Baseline Profile for the scroll journey, and test in **release** builds.

</details>

### 17. How would you migrate a legacy app (Java + MVP + XML) to modern Android?

<details>
<summary>Answer</summary>

**Incrementally**, with no big-bang rewrite:
1. Add Kotlin, and write new code in Kotlin.
2. Introduce Hilt and modularize gradually.
3. Move from MVP to MVVM screen by screen (ViewModel + StateFlow).
4. Replace RxJava with coroutines and Flow from the data layer up, using interop adapters.
5. Adopt Compose for new screens, then migrate shared components (ComposeView / AndroidView interop).
6. Add tests before refactoring risky areas, and track crash rate and performance throughout.

</details>

### 18. How would you handle an API that sometimes returns malformed data?

<details>
<summary>Answer</summary>

Use lenient, defensive parsing (nullable DTO fields with defaults, `ignoreUnknownKeys = true` in kotlinx.serialization, `coerceInputValues`). Validate when mapping DTO → domain (drop or flag invalid items instead of crashing the whole list). Report errors to monitoring, and coordinate with the backend on contract tests and API versioning.

</details>

### 19. How do you ensure a payment request isn't submitted twice?

<details>
<summary>Answer</summary>

Disable the button and show a loading state (UI). Use an **idempotency key** (a client-generated UUID sent with the request, so the server deduplicates). Persist the in-flight state so it survives process death. Never automatically retry non-idempotent requests without that key. Confirm the result through the server or webhook before showing success.

</details>

---

## Behavioral & Project Questions

### 20. "Tell me about yourself" – how to structure it?

<details>
<summary>Answer</summary>

60–90 seconds: **present** (current role, the app and its scale, your responsibilities) → **past** (relevant experience and key achievements with **numbers**: "reduced cold start by 35%", "crash-free sessions from 98.5% to 99.8%") → **future** (why this role or company). Stay technical and relevant.

</details>

### 21. "Explain the architecture of your current project."

<details>
<summary>Answer</summary>

See [Architecture Q18](12-architecture.md). Draw it: modules → layers → data flow. Mention one trade-off and one thing you'd improve.

</details>

### 22. "What's the most challenging problem you solved?" (STAR method)

<details>
<summary>Answer</summary>

Use **STAR**: **Situation** (context) → **Task** (your responsibility) → **Action** (what *you* did technically, step by step) → **Result** (measurable impact plus what you learned).

Good stories to prepare: a hard production crash or ANR you fixed, a performance improvement, a migration (Rx → Flow, XML → Compose), an offline sync design, a conflict about a technical decision, a missed deadline and what you changed afterwards.

</details>

### 23. Common behavioral questions to prepare.

<details>
<summary>Answer</summary>

- A disagreement with a teammate, PM or designer and how you resolved it.
- A time you made a mistake in production.
- How you handle code reviews (giving and receiving).
- How you prioritize tech debt vs features.
- A time you mentored someone or led an initiative.
- How you estimate tasks and handle tight deadlines.
- Why are you leaving your current job? (Stay positive.)
- Questions for the interviewer: team structure, release cadence, testing culture, tech stack, the biggest technical challenges right now.

</details>


### 24. How do you do code reviews?

<details>
<summary>Answer</summary>

**As a reviewer:**
1. Understand the **intent** (ticket, PR description), then check **correctness** (edge cases, nulls, error paths, concurrency, lifecycle and process death).
2. **Architecture fit** (layering, no Context in the ViewModel, reuse of existing components), **readability** (naming, small functions), **tests** (new logic covered, meaningful assertions).
3. **Android-specific:** main-thread I/O, leaks (listeners, scopes), recomposition and performance hot spots, permissions, accessibility, strings in resources, R8 rules, security (logging PII, exported components).
4. Be **kind and specific**: ask questions instead of dictating, explain the *why*, separate blocking issues from nits, and praise good work. Automate style checks (ktlint/Detekt/Lint) so reviews can focus on substance.

**As an author:** small, focused PRs, a clear description with screenshots or videos, self-review first, and respond to all comments.

</details>

### 25. Agile vs Waterfall? How does your team work?

<details>
<summary>Answer</summary>

- **Waterfall** – sequential phases (requirements → design → build → test → release). Predictable for fixed scope, but changes are expensive and feedback comes late.
- **Agile** – **iterative**, small increments, continuous feedback and adaptation. **Scrum** uses fixed sprints (planning, daily stand-up, review, retrospective) with roles (Product Owner, Scrum Master, team). **Kanban** uses a continuous flow with WIP limits.

For mobile teams, mention: sprint cadence vs **release trains** (e.g. a weekly or bi-weekly store release), feature flags so unfinished work can ship dark, and the definition of done (tests, code review, QA sign-off, analytics added).

</details>

---

[⬅ Previous: What's New & Trending](24-whats-new-trending.md) · [⬅ Back to index](../README.md) · [Next: Accessibility & Localization ➡](26-accessibility-localization.md)
