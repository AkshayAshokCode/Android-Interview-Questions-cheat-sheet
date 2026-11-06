# Android Interview Questions – Cheat Sheet

A revision guide for Android developer interviews: **660+ questions with interview-ready answers**, split into 26 topics, from Kotlin basics to Compose, architecture, system design and what's new in Android.

Every answer is hidden in a collapsible block, so you can **test yourself first** and then click to check.

> **📈 [Open the interactive study tracker](https://akshayashokcode.github.io/Android-Interview-Questions-cheat-sheet/)**: mark questions ✓ Done or ↻ Revise, see your progress per topic and category, search every question, and continue where you left off. Progress is saved in your browser (export/import to move it between devices).

---

## How to use this repo

1. **Pick a topic** from the index below.
2. **Read the question, answer it out loud**, then expand **Answer** to compare.
3. Re-read the questions you got wrong. Use the [Last-Minute Revision](#-last-minute-revision-one-liners) list on interview day.

> Tip: interviewers care about **why** and **trade-offs** as much as **what**. Most answers include a "when to use / why" point. Say that part out loud.

---

## Topics

### 🟣 Kotlin & Language

| # | Topic | Questions | Key areas |
|---|---|---|---|
| 01 | [Kotlin Fundamentals](topics/01-kotlin-basics.md) | 44 | val/var/const, null safety, data/sealed classes, object, lateinit vs lazy, collections, extension & infix functions |
| 02 | [Kotlin Advanced](topics/02-kotlin-advanced.md) | 28 | Scope functions, inline/reified, generics & variance, delegation, Jvm annotations, DSLs, K2 |
| 03 | [Kotlin Coroutines](topics/03-coroutines.md) | 34 | suspend internals, dispatchers, scopes, Job vs SupervisorJob, cancellation, exception handling |
| 04 | [Kotlin Flow](topics/04-flow.md) | 23 | Cold vs hot, StateFlow vs SharedFlow vs LiveData, stateIn, operators, one-time events |
| 05 | [Java for Android](topics/05-java.md) | 41 | String pool, equals/hashCode, HashMap internals, JVM memory, references, multithreading |

### 🟢 Fundamentals & Design

| # | Topic | Questions | Key areas |
|---|---|---|---|
| 06 | [OOP & SOLID](topics/06-oop-solid.md) | 16 | OOP pillars, composition vs inheritance, SOLID with Android examples |
| 07 | [Design Patterns](topics/07-design-patterns.md) | 26 | Creational/structural/behavioral patterns and where Android uses each one |
| 08 | [Android Fundamentals](topics/08-android-fundamentals.md) | 37 | ART/Dalvik, JIT/AOT, GC, DEX, components, Context, Manifest, Intents, Binder, app launch flow |
| 09 | [Activity, Fragment & Lifecycle](topics/09-activity-fragment.md) | 29 | Lifecycles, config change vs process death, launch modes, fragment transactions, back handling |

### 🔵 UI

| # | Topic | Questions | Key areas |
|---|---|---|---|
| 10 | [UI – Views, XML & RecyclerView](topics/10-ui-views.md) | 32 | Measure/layout/draw, custom views, RecyclerView recycling & DiffUtil, touch events, insets |
| 11 | [Jetpack Compose](topics/11-jetpack-compose.md) | 42 | Recomposition, state & hoisting, side effects, stability & strong skipping, lazy lists, navigation |
| 26 | [Accessibility & Localization](topics/26-accessibility-localization.md) | 10 | TalkBack, Compose semantics, touch targets, font scaling, plurals, RTL, per-app language, formatting |

### 🟠 Architecture & Libraries

| # | Topic | Questions | Key areas |
|---|---|---|---|
| 12 | [App Architecture](topics/12-architecture.md) | 20 | MVVM vs MVI vs MVP, Clean Architecture, UDF, SSOT, offline-first, modularization |
| 13 | [Jetpack Components](topics/13-jetpack-components.md) | 21 | ViewModel internals, SavedStateHandle, LiveData, Navigation, Paging 3 |
| 14 | [Dependency Injection](topics/14-dependency-injection.md) | 18 | Dagger, Hilt components & scopes, qualifiers, assisted injection, Koin |
| 15 | [Networking](topics/15-networking.md) | 24 | Retrofit internals, OkHttp interceptors, token refresh, error handling, caching, WebSockets |
| 16 | [Data Storage](topics/16-data-storage.md) | 20 | DataStore vs SharedPreferences, Room, migrations, relations, scoped storage, secure storage |
| 17 | [Threading & Background Work](topics/17-threading-background-work.md) | 26 | Looper/Handler, ANR, Services, foreground services, WorkManager, Doze, alarms |
| 18 | [RxJava](topics/18-rxjava.md) | 19 | Observable types, schedulers, flatMap vs switchMap, Subjects, backpressure, migration to Flow |

### 🔴 Quality, Security & Delivery

| # | Topic | Questions | Key areas |
|---|---|---|---|
| 19 | [Performance & Memory](topics/19-performance-memory.md) | 23 | Memory leaks, LRU cache, bitmaps, jank, startup, Baseline Profiles, app size, vitals |
| 20 | [Testing](topics/20-testing.md) | 19 | Test pyramid, fakes vs mocks, ViewModel/coroutine/Flow tests, Espresso, Compose tests |
| 21 | [Security & Permissions](topics/21-security-permissions.md) | 22 | Runtime permissions by version, Keystore, pinning, Play Integrity, passkeys |
| 22 | [Build, Gradle & Release](topics/22-build-gradle-release.md) | 22 | Build variants, api vs implementation, version catalogs, KSP, AAB, CI/CD, 16 KB pages |

### ⭐ Interview Rounds

| # | Topic | Questions | Key areas |
|---|---|---|---|
| 23 | [Android System Design](topics/23-system-design.md) | 22 | Framework + designs: image loader, chat, feed, offline sync, downloader, analytics SDK |
| 24 | [What's New & Trending](topics/24-whats-new-trending.md) | 21 | Android 14/15/16 changes, edge-to-edge, predictive back, KMP, Compose updates, on-device AI |
| 25 | [Coding, Scenarios & Behavioral](topics/25-coding-scenarios.md) | 25 | LRU cache, debounce, pagination, debugging scenarios, STAR answers |

---

## 🗓 Suggested revision plans

**2-week plan (≈1–2 hours/day)**

| Day | Topics |
|---|---|
| 1 | 01 Kotlin Fundamentals |
| 2 | 02 Kotlin Advanced + 06 OOP & SOLID |
| 3 | 03 Coroutines |
| 4 | 04 Flow + 18 RxJava (if the job uses it) |
| 5 | 08 Android Fundamentals |
| 6 | 09 Activity & Fragment + 10 Views |
| 7 | 11 Jetpack Compose + 26 Accessibility & Localization |
| 8 | 12 Architecture + 13 Jetpack Components |
| 9 | 14 DI + 15 Networking |
| 10 | 16 Storage + 17 Background Work |
| 11 | 19 Performance + 20 Testing |
| 12 | 21 Security + 22 Build & Release + 05 Java |
| 13 | 23 System Design + 24 What's New |
| 14 | 07 Design Patterns + 25 Coding & Behavioral + Last-Minute Revision |

**2 days before:** Coroutines (03), Flow (04), Compose (11), Architecture (12), Lifecycle (09), Performance (19), System Design (23) and the list below.

---

## ⚡ Last-Minute Revision (one-liners)

<details>
<summary>Open the quick revision list</summary>

**Kotlin**
- `val` = read-only reference; `const val` = compile-time constant, inlined; `var` = mutable.
- `==` calls equals(); `===` checks the same reference.
- `lateinit var` (non-null, assigned later) vs `by lazy` (val, computed on first access, thread-safe).
- Data class gives equals/hashCode/toString/copy/componentN from **primary-constructor** properties only.
- Sealed = closed set of **types** (each can carry state); enum = closed set of **instances**.
- Extension functions are **static and resolved at compile time**; a member function with the same signature wins.
- `inline` removes lambda allocations, allows non-local returns and `reified`; `crossinline` forbids non-local returns.
- `out` = producer (covariant), `in` = consumer (contravariant).
- apply/also return the **object**; let/run/with return the **lambda result**.

**Coroutines & Flow**
- `suspend` = CPS + a state machine; it doesn't switch threads by itself.
- Dispatchers: Main (UI), IO (blocking I/O), Default (CPU work).
- `launch` returns a Job; `async` returns a Deferred (call `await()`).
- `coroutineScope`: one child fails, all are cancelled. `supervisorScope`: children fail independently.
- Cancellation is cooperative. Never swallow `CancellationException`.
- `CoroutineExceptionHandler` only works on root coroutines.
- Cold Flow runs per collector. StateFlow is hot, conflated, has an initial value and skips duplicates. SharedFlow is hot and used for events.
- Collect with `repeatOnLifecycle(STARTED)` / `collectAsStateWithLifecycle()`.
- `stateIn(scope, WhileSubscribed(5000), initial)` keeps the upstream through rotation.
- `flatMapLatest` + `debounce` + `distinctUntilChanged` = search.

**Android Core**
- 4 components: Activity, Service, BroadcastReceiver, ContentProvider.
- Rotation: the Activity is recreated, the ViewModel survives. Process death: the ViewModel is lost; use SavedStateHandle and persistent storage.
- A → B: A.onPause → B.onCreate/onStart/onResume → A.onStop.
- Launch modes: standard, singleTop (`onNewIntent` if on top), singleTask (clears activities above it), singleInstance (alone in its task).
- Never keep an Activity Context in a long-lived object (leak). Use applicationContext.
- Parcelable (with `@Parcelize`) is faster than Serializable (reflection). Binder transactions are limited to ~1 MB.
- ANR: main thread blocked about 5 s for input, ~10 s for a broadcast.
- Fragment: observe with `viewLifecycleOwner`, null the binding in `onDestroyView`.

**UI & Compose**
- View drawing: measure → layout → draw. `invalidate()` = redraw; `requestLayout()` = re-measure.
- RecyclerView: scrap → cache (2) → RecycledViewPool (5 per type) → onCreateViewHolder. DiffUtil + ListAdapter.
- Compose phases: Composition → Layout → Drawing. Recomposition re-runs only the scopes that read changed state.
- `remember` survives recomposition; `rememberSaveable` also survives config changes and process death.
- State hoisting: state goes down, events go up (`value` + `onValueChange`).
- LaunchedEffect (suspend, keyed), DisposableEffect (cleanup), rememberCoroutineScope (from callbacks), SideEffect, derivedStateOf.
- Strong skipping is on by default; give lazy lists stable `key`s; modifier order matters.

**Architecture & Libraries**
- MVVM + UDF + a single `StateFlow<UiState>`. Layers: UI → (Domain) → Data. Room is the SSOT for offline-first apps.
- Hilt: SingletonComponent → ActivityRetained → ViewModel → Activity → Fragment → View. `@Binds` for interfaces, `@Provides` for builders.
- Retrofit = a dynamic proxy over OkHttp. Application vs network interceptors. Use an `Authenticator` to refresh tokens on 401.
- DataStore replaces SharedPreferences. Room: compile-time-checked SQL, Flow support, migrations.
- WorkManager = guaranteed background work (15 min minimum period). Foreground services need a type on Android 14+.

**Quality & Release**
- Common leaks: static Context, inner Handlers or Runnables, unregistered listeners, fragment bindings, GlobalScope.
- Startup: lazy init, App Startup, Baseline Profiles (~20–30% faster), R8.
- Tests: fakes over mocks, `runTest`, `Dispatchers.setMain`, Turbine, MockWebServer.
- `implementation` doesn't leak to consumers; `api` does. Prefer KSP over kapt. Publish as AAB with Play App Signing.
- Security: Keystore, HTTPS with pinning, no secrets in the APK, Play Integrity checked on the server, Credential Manager/passkeys.

</details>

---

## 📚 Official references

- [Android Developers – Guide](https://developer.android.com/guide) · [Guide to app architecture](https://developer.android.com/topic/architecture)
- [Kotlin docs](https://kotlinlang.org/docs/home.html) · [Coroutines guide](https://kotlinlang.org/docs/coroutines-guide.html)
- [Jetpack Compose docs](https://developer.android.com/develop/ui/compose) · [Now in Android sample](https://github.com/android/nowinandroid)
- [Android behaviour changes by API level](https://developer.android.com/about/versions)

---

## 🤝 Contributing

Found a mistake or have a question you were asked in an interview? Open an issue or PR. Keep the format: a numbered `###` question + a `<details><summary>Answer</summary>` block, concise and interview-ready.

⭐ If this helped you prepare, consider starring the repo!
