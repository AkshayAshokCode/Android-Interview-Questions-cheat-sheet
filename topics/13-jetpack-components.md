# Jetpack Components – ViewModel, LiveData, Navigation, Paging

[⬅ Back to index](../README.md)

Covers: ViewModel (and its internals), SavedStateHandle, LiveData, Navigation component, Paging 3, App Startup. (Room/DataStore → [Data Storage](16-data-storage.md); WorkManager → [Background Work](17-threading-background-work.md).)

---

## ViewModel

### 1. What is a ViewModel? Why use it?

<details>
<summary>Answer</summary>

A ViewModel is a **state holder** for UI-related data and business-logic entry points that is **lifecycle-aware**. It **survives configuration changes** (rotation, theme or language change), so data isn't refetched and running work isn't lost.

- It exposes UI state (`StateFlow`) and handles UI events.
- It has `viewModelScope` for coroutines, cancelled in `onCleared()`.
- It must **not** reference Views, Activities or Fragments.
- It does **not** survive **process death** (use `SavedStateHandle` for that).

</details>

### 2. How does ViewModel survive configuration changes? (Internals)

<details>
<summary>Answer</summary>

- Each `ViewModelStoreOwner` (ComponentActivity, Fragment, NavBackStackEntry) has a **`ViewModelStore`** (essentially a `Map<String, ViewModel>`).
- `ViewModelProvider(owner, factory).get(MyVM::class)` looks up the store by key and creates the ViewModel through the factory only if it's missing.
- On a configuration change, `ComponentActivity` keeps the `ViewModelStore` alive through **`onRetainNonConfigurationInstance()`** / `getLastNonConfigurationInstance()`, so the new Activity instance receives the **same store**.
- When the Activity is **really finishing** (`isChangingConfigurations == false`), a lifecycle observer calls `viewModelStore.clear()` → `onCleared()` on every ViewModel.
- Fragments' stores are kept in the `FragmentManagerViewModel`, which itself lives in the Activity's store.

</details>

### 3. What is the ViewModel lifecycle / when is `onCleared()` called?

<details>
<summary>Answer</summary>

A ViewModel lives from first creation until its owner is **permanently** gone: the Activity finishes, the Fragment is removed (and not on the back stack), or the nav destination is popped. Then `onCleared()` is called. Use it to release resources (although `viewModelScope` is cancelled automatically). You can also register `addCloseable()` objects to be closed.

</details>

### 4. What is a ViewModelProvider.Factory? How do you pass parameters to a ViewModel?

<details>
<summary>Answer</summary>

The default provider can only create ViewModels with an empty constructor. A **Factory** builds ViewModels that need dependencies:

```kotlin
val factory = viewModelFactory { initializer { DetailViewModel(repo, createSavedStateHandle()) } }
val vm: DetailViewModel by viewModels { factory }
```

With **Hilt**: `@HiltViewModel class DetailViewModel @Inject constructor(repo: Repo, savedStateHandle: SavedStateHandle)`, then use `by viewModels()` / `hiltViewModel()`. For runtime parameters, use **assisted injection** (`@AssistedInject` + `@HiltViewModel(assistedFactory = ...)`).

</details>

### 5. `by viewModels()` vs `by activityViewModels()` vs `navGraphViewModels()`?

<details>
<summary>Answer</summary>

- `viewModels()` – scoped to **this** Activity or Fragment.
- `activityViewModels()` – in a Fragment, scoped to the **host Activity**. Used to **share** a ViewModel between fragments.
- `navGraphViewModels(R.id.graph)` / `hiltViewModel(navController.getBackStackEntry(route))` – scoped to a **navigation graph** (shared across a flow such as checkout, and cleared when the graph is popped).
- Compose: `viewModel()` / `hiltViewModel()` default to the nearest `LocalViewModelStoreOwner` (the NavBackStackEntry or the Activity).

</details>

### 6. What is SavedStateHandle?

<details>
<summary>Answer</summary>

A key-value map injected into a ViewModel that **survives process death** (it's saved to the saved-instance-state Bundle). It automatically contains **navigation arguments** and Intent extras.

```kotlin
class SearchViewModel(private val savedState: SavedStateHandle) : ViewModel() {
    val query: StateFlow<String> = savedState.getStateFlow("query", "")
    fun onQueryChange(q: String) { savedState["query"] = q }
}
```

Store **small** data only (Bundle limits).

</details>

### 7. Can a ViewModel be shared between Activities?

<details>
<summary>Answer</summary>

Not with standard scoping: each Activity has its own `ViewModelStore`. For data shared between Activities, use a **repository or singleton through DI** (and a shared Flow), or move to a **single-Activity** architecture.

</details>

### 8. Why not use `AndroidViewModel`?

<details>
<summary>Answer</summary>

`AndroidViewModel` receives the `Application` context. It's safe from leaks (it's the application context), but it couples the ViewModel to the Android framework and makes unit testing harder. Prefer injecting the dependencies that need a Context (repositories, resource providers).

</details>

---

## LiveData

### 9. What is LiveData? What are its benefits?

<details>
<summary>Answer</summary>

LiveData is an **observable, lifecycle-aware data holder**. Observers are notified **only while their LifecycleOwner is active** (`STARTED`/`RESUMED`), and they're **removed automatically** on `DESTROYED`.

Benefits: no memory leaks, no crashes from updating stopped activities, always up-to-date data after inactive → active, survives configuration changes when used with a ViewModel.

Today, **StateFlow** is preferred for new code (pure Kotlin, operators, KMP), but LiveData still appears in many codebases.

</details>

### 10. `setValue()` vs `postValue()`?

<details>
<summary>Answer</summary>

- `setValue()` – **main thread only**. Updates immediately and dispatches to observers synchronously.
- `postValue()` – from **any thread**. Posts a task to the main thread. If called several times before that task runs, **only the last value is dispatched** (intermediate values are lost).

</details>

### 11. What are `Transformations.map` / `switchMap` and `MediatorLiveData`?

<details>
<summary>Answer</summary>

- `liveData.map { }` – transform each value.
- `liveData.switchMap { id -> repo.getUser(id) }` – switch to a new LiveData source on each value (like `flatMapLatest`).
- `MediatorLiveData` – observe **multiple** LiveData sources and combine them (`addSource`).
- The `liveData { emit(..) }` builder runs a coroutine while there are active observers.

</details>

### 12. What is the SingleLiveEvent problem?

<details>
<summary>Answer</summary>

LiveData **re-delivers the last value** to new observers (e.g. after rotation), so one-time events like navigation or a Toast fire again. `SingleLiveEvent` / the `Event` wrapper were workarounds. Modern guidance: **model events as state** and consume them explicitly, or use a `Channel`. See [Flow Q8](04-flow.md).

</details>

### 13. LiveData vs StateFlow – when would you still use LiveData?

<details>
<summary>Answer</summary>

LiveData: simple, lifecycle-aware out of the box, and good for Java codebases or DataBinding. StateFlow: Kotlin-first, needs an initial value, rich operators, works outside Android (domain layer, KMP), easier to test, and needs `repeatOnLifecycle`/`collectAsStateWithLifecycle`. Convert with `asLiveData()` / `asFlow()`.

</details>

---

## Navigation Component

### 14. What is the Navigation component? What are its parts?

<details>
<summary>Answer</summary>

A Jetpack library for in-app navigation, built for **single-Activity** apps.
- **NavGraph** – the destinations and actions (XML, Kotlin DSL, or type-safe Compose routes).
- **NavHost** – the container that shows destinations (`NavHostFragment` / Compose `NavHost`).
- **NavController** – navigates (`navigate()`, `popBackStack()`, `navigateUp()`).

Features: back stack management, type-safe arguments (**Safe Args** for XML, `@Serializable` routes for Compose), **deep links**, nested graphs, transition animations, ViewModel scoping to graphs, integration with bottom navigation and toolbars.

</details>

### 15. What are `popUpTo` and `launchSingleTop`?

<details>
<summary>Answer</summary>

- `popUpTo(route) { inclusive = true }` – pop destinations off the back stack up to `route` before navigating. Example: after login, navigate to Home and pop Login so Back doesn't return to it.
- `launchSingleTop = true` – avoid duplicate copies of the destination on top of the stack (like `singleTop`).
- `saveState` / `restoreState` – keep each bottom-nav tab's back stack state (multiple back stacks).

</details>

### 16. How do you implement bottom navigation with multiple back stacks?

<details>
<summary>Answer</summary>

```kotlin
navController.navigate(tabRoute) {
    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
    launchSingleTop = true
    restoreState = true
}
```

Each tab keeps its own stack and state when the user switches tabs.

</details>

---

## Paging 3

### 17. What is Paging 3? Explain its components.

<details>
<summary>Answer</summary>

A library to load large data sets **page by page**, with caching, retry, loading states and coroutine/Flow support.
- **`PagingSource<Key, Value>`** – loads pages from one source (`load(params)` returns `LoadResult.Page(data, prevKey, nextKey)` or `LoadResult.Error`).
- **`RemoteMediator`** – for **network + database** (offline-first). It fetches from the network into Room when the local data runs out. Room provides the `PagingSource`.
- **`Pager`** → `Flow<PagingData<T>>`. Use **`cachedIn(viewModelScope)`** to survive configuration changes.
- **UI:** `PagingDataAdapter` (Views) or `collectAsLazyPagingItems()` (Compose).
- **`LoadState`** (`Loading`, `NotLoading`, `Error`) for refresh/append/prepend → show loaders and retry buttons.

</details>

---

## Others

### 18. What is the App Startup library?

<details>
<summary>Answer</summary>

Libraries often initialize themselves through their own `ContentProvider`, and **each provider adds startup cost**. **App Startup** provides a single shared `InitializationProvider` where you declare `Initializer<T>` classes with dependencies between them, either initialized at startup or lazily. This reduces cold start time.

</details>

### 19. What is the Lifecycle-aware `repeatOnLifecycle` and `flowWithLifecycle`?

<details>
<summary>Answer</summary>

`repeatOnLifecycle(STARTED) { }` runs a block when the lifecycle reaches STARTED and cancels it on STOPPED, repeating as the lifecycle goes up and down. `flow.flowWithLifecycle(lifecycle, STARTED)` does the same for a single flow. They're the recommended way to collect flows in Views. See [Flow Q6](04-flow.md).

</details>

### 20. What other Jetpack libraries should you know?

<details>
<summary>Answer</summary>

- **Room**, **DataStore** – storage.
- **WorkManager** – guaranteed background work.
- **Hilt** – DI.
- **CameraX** – camera API on top of Camera2.
- **Media3 (ExoPlayer)** – media playback.
- **Biometric**, **Credential Manager** (passkeys).
- **Window / Material3 Adaptive** – foldables and large screens.
- **Macrobenchmark / Baseline Profiles / ProfileInstaller** – performance.
- **Glance** – app widgets with Compose-style code.
- **Health Connect**, **Security-crypto** (deprecated now; use Keystore directly), **Splash Screen API**, **Activity Result API**, **Photo Picker**.

</details>

---

[⬅ Previous: Architecture](12-architecture.md) · [⬅ Back to index](../README.md) · [Next: Dependency Injection ➡](14-dependency-injection.md)
