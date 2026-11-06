# Performance & Memory

[⬅ Back to index](../README.md)

Covers: memory leaks, LeakCanary, OOM, LRU cache, bitmaps, app lag/jank, startup time, Baseline Profiles, app size, battery, profiling tools, Android vitals.

---

## Memory

### 1. What is a memory leak? What are common leaks in Android?

<details>
<summary>Answer</summary>

A memory leak is an object that's **no longer needed but is still reachable** from a GC root, so the GC can't free it. In Android, leaking an **Activity** leaks its whole view hierarchy and bitmaps, so memory keeps growing until `OutOfMemoryError`.

Common causes:
1. A **static field or singleton holding an Activity/View/Context** (e.g. `object Manager { lateinit var context: Context }`).
2. **Non-static inner classes, anonymous classes or lambdas** (Handler, Runnable, AsyncTask, Thread) that outlive the Activity.
3. **Unregistered listeners/callbacks**: BroadcastReceivers, sensor or location listeners, `ViewTreeObserver` listeners, RxJava subscriptions that were never disposed.
4. **Fragment ViewBinding** not cleared in `onDestroyView`.
5. **LiveData observed with the fragment instead of `viewLifecycleOwner`.**
6. **Coroutines in `GlobalScope`**, or long-running work that captures views.
7. A ViewModel holding a View or Activity reference.
8. Unclosed resources (Cursor, streams).

</details>

### 2. Write code that leaks memory and fix it.

<details>
<summary>Answer</summary>

```kotlin
// ❌ Leak: singleton keeps Activity context forever
object ImageCache {
    lateinit var context: Context
}
class MainActivity : AppCompatActivity() {
    override fun onCreate(s: Bundle?) { super.onCreate(s); ImageCache.context = this }
}
// ✅ Fix: use applicationContext (or don't store context at all)
ImageCache.context = applicationContext
```

```kotlin
// ❌ Leak: delayed runnable references Activity for 5 minutes
handler.postDelayed({ textView.text = "Done" }, 300_000)
// ✅ Fix: remove callbacks in onDestroy, or use lifecycleScope:
lifecycleScope.launch { delay(300_000); textView.text = "Done" }  // auto-cancelled
```

Plain Java example: an ever-growing static list:
```java
private static final List<Object> cache = new ArrayList<>();  // never cleared → leak
```

</details>

### 3. How do you detect memory leaks?

<details>
<summary>Answer</summary>

- **LeakCanary** (debug builds): watches destroyed Activities, Fragments, ViewModels and Views. If they aren't GC'd within ~5 s, it dumps the heap and shows the **leak trace** (the reference chain from a GC root).
- **Android Studio Memory Profiler**: capture a heap dump, look for leaked Activities (it has a filter for that), check allocations.
- `adb shell dumpsys meminfo <package>`.
- **StrictMode** `detectActivityLeaks()`.

</details>

### 4. What is OutOfMemoryError? How do you prevent it?

<details>
<summary>Answer</summary>

It's thrown when the app's heap (a per-app limit) can't fit a new allocation. Typical causes: **large bitmaps**, leaks, loading huge data sets into memory, and unbounded caches.

Prevention: **downsample bitmaps** (image libraries do this), fix leaks, use **bounded caches** (`LruCache`), use Paging, stream large files, respond to `onTrimMemory()`. `android:largeHeap="true"` is a last resort, not a fix.

</details>

### 5. What is an LRU Cache? How does it work?

<details>
<summary>Answer</summary>

**Least Recently Used** cache: a fixed-capacity cache that **evicts the least recently accessed item** when it's full.
- `get(key)` → returns the value and marks it **most recently used**.
- `put(key, value)` → inserts it; if the size exceeds capacity, evicts the eldest.
- Implemented with a **HashMap + doubly linked list** (O(1) get/put). In Java/Kotlin, `LinkedHashMap(accessOrder = true)` + override `removeEldestEntry`.

Android's `android.util.LruCache` is commonly used for **bitmap memory caches**:
```kotlin
val maxKb = (Runtime.getRuntime().maxMemory() / 1024).toInt()
val cache = object : LruCache<String, Bitmap>(maxKb / 8) {
    override fun sizeOf(key: String, value: Bitmap) = value.byteCount / 1024
}
```

See [Scenarios](25-coding-scenarios.md) for an implementation.

</details>

### 6. How do you handle bitmaps efficiently?

<details>
<summary>Answer</summary>

A bitmap's size is `width × height × bytes per pixel` (ARGB_8888 = 4 bytes, so a 4000×3000 photo ≈ **48 MB**).
- **Downsample**: decode with `inJustDecodeBounds = true` to read the dimensions, then decode with `inSampleSize` to match the target view size.
- Use `RGB_565` (2 bytes) when you don't need alpha. Use **Hardware bitmaps** (`Config.HARDWARE`), which store pixel data in GPU memory.
- Cache them (memory + disk) and reuse bitmaps (`inBitmap`).
- **Use Coil or Glide**, which do all of this.
- Prefer **vector drawables** for icons and **WebP/AVIF** for images.

</details>

### 7. What is `onTrimMemory()`?

<details>
<summary>Answer</summary>

A callback (`ComponentCallbacks2`) telling the app about memory pressure. For example, `TRIM_MEMORY_UI_HIDDEN` means the UI moved to the background, so release UI resources. Release caches proportionally. Several of the older levels are deprecated in recent APIs; `UI_HIDDEN` and `BACKGROUND` remain the important ones.

</details>

---

## UI Performance

### 8. Why does an Android app lag? What is jank?

<details>
<summary>Answer</summary>

**Jank** = dropped frames. Each frame must be produced in **16.6 ms at 60 Hz** (8.3 ms at 120 Hz). Causes:
1. **Main-thread work**: I/O, network, DB, JSON parsing, heavy computation.
2. **Complex or deep layouts**, nested weights, expensive measure/layout passes. In Compose, **excessive recomposition**.
3. **Overdraw** (drawing the same pixel many times).
4. **Allocations in hot paths** (`onDraw`, `onBindViewHolder`, scroll) → **GC pauses**.
5. **Large bitmaps** decoded on the main thread.
6. Memory leaks → memory pressure → frequent GC.
7. Lock contention and Binder calls on the main thread.
8. Slow first run: code isn't JIT/AOT-compiled yet (fix with **Baseline Profiles**).
9. Low-end device constraints, inefficient third-party SDKs.

</details>

### 9. How do you find and fix jank?

<details>
<summary>Answer</summary>

**Measure:**
- **Perfetto / System Trace** in the Android Studio CPU Profiler – look at the main thread and RenderThread, Choreographer frames, long slices.
- Profile GPU Rendering bars, Debug GPU Overdraw.
- **JankStats** library (production jank reporting).
- **Macrobenchmark** `FrameTimingMetric`.
- Android vitals (slow and frozen frames).

**Fix:** move work off the main thread, flatten layouts, use DiffUtil with stable IDs, avoid allocations in draw and bind, fix Compose stability and unnecessary recomposition, **Baseline Profiles**, and measure in **release** builds.

</details>

### 10. What is Choreographer / vsync / RenderThread?

<details>
<summary>Answer</summary>

- **Vsync** – the display's refresh signal (e.g. every 16.6 ms).
- **Choreographer** – receives vsync and schedules **input → animation → traversal (measure/layout/draw)** for the next frame on the main thread.
- **RenderThread** – a separate thread that takes the recorded **display lists** and issues GPU commands (hardware acceleration), so animations can continue even if the main thread is briefly busy.

</details>

---

## Startup

### 11. Cold vs warm vs hot start?

<details>
<summary>Answer</summary>

- **Cold** – the process doesn't exist: fork from Zygote → `Application.onCreate` → Activity creation → first frame. The slowest kind.
- **Warm** – the process exists, but the Activity has to be recreated (e.g. the user backed out, or it was evicted).
- **Hot** – the Activity is still in memory and is just brought to the foreground (`onStart`/`onResume`).

Metrics: **TTID** (Time To Initial Display, logged as `Displayed` in Logcat) and **TTFD** (Time To Full Display, which you mark with `reportFullyDrawn()`). Android vitals flags cold starts ≥ 5 s, warm ≥ 2 s, hot ≥ 1.5 s as excessive.

</details>

### 12. How do you improve app startup time?

<details>
<summary>Answer</summary>

- Keep `Application.onCreate()` light: **lazy-init** SDKs, use **App Startup**, defer non-critical init until after the first frame or to a background thread. Avoid DI graphs that eagerly create heavy objects (use `Lazy<T>`).
- **Baseline Profiles** + **Startup Profiles** (DEX layout optimization) typically give **~20–30%** faster startup.
- Enable **R8** full mode.
- Make the first screen's layout simple, and load data asynchronously with placeholders/skeletons.
- Use the **SplashScreen API** properly (don't add artificial delays).
- Avoid disk and network I/O on the main thread during startup. Check with StrictMode.
- Measure with **Macrobenchmark** (`StartupTimingMetric`) and Perfetto.

</details>

### 13. What are Baseline Profiles?

<details>
<summary>Answer</summary>

A Baseline Profile is a list of classes and methods used in **critical user journeys** (startup, scrolling, navigation), shipped inside the APK/AAB. At install time, ART **AOT-compiles** those paths, so the first run doesn't have to rely on the interpreter and JIT. Google reports roughly **30% faster** code execution from the first launch.

Generate them with the **Baseline Profile Gradle plugin** + a Macrobenchmark `BaselineProfileRule` test that runs your user journeys. Libraries like Compose ship their own profiles. **Startup Profiles** additionally optimize the DEX layout. ProfileInstaller handles installation for sideloaded builds.

</details>

### 14. What is Macrobenchmark vs Microbenchmark?

<details>
<summary>Answer</summary>

- **Macrobenchmark** – measures **end-to-end user interactions** (startup, scrolling, animations) on a real device from a separate test module. Metrics: `StartupTimingMetric`, `FrameTimingMetric`. Also generates Baseline Profiles.
- **Microbenchmark** – measures small pieces of code (a function, a JSON parser) in a loop with warm-up, reporting ns per op.

</details>

---

## Size & Battery

### 15. How do you reduce APK/AAB size?

<details>
<summary>Answer</summary>

- **R8**: code shrinking + obfuscation + optimization (`isMinifyEnabled = true`), and **resource shrinking** (`isShrinkResources = true`).
- **Android App Bundle (AAB)**: Play generates optimized APKs per device (ABI, density, language). Typically ~15%+ smaller.
- **WebP/AVIF** images, vector drawables, removing unused resources and languages (`androidResources.localeFilters`).
- Audit dependencies (avoid heavy libraries for small features).
- **Play Feature Delivery** (dynamic feature modules on demand) and **Play Asset Delivery** (large assets).
- Analyze with **APK Analyzer**.

</details>

### 16. How do you optimize battery usage?

<details>
<summary>Answer</summary>

Batch network calls and defer them with **WorkManager** (constraints such as charging or unmetered), avoid wake locks and frequent polling (use **FCM**), use the right location priority and intervals (balanced power, geofencing), stop sensors and location updates in `onStop`, respect Doze, and avoid unnecessary foreground services. Check with **Battery Historian**, the Energy profiler and Android vitals (excessive wake-ups, wake locks).

</details>

---

## Tools & Metrics

### 17. What profiling tools do you use?

<details>
<summary>Answer</summary>

- **Android Studio Profilers** – CPU (method/system traces), Memory (heap dump, allocations), Network, Energy, plus **Layout Inspector** (Compose recomposition counts) and the **App Inspection** tools (Database, Network, Background Task Inspector).
- **Perfetto** (`ui.perfetto.dev`) – system-wide tracing.
- **LeakCanary**, **StrictMode**.
- **Macrobenchmark / JankStats**.
- **Firebase Performance Monitoring**, **Crashlytics**.
- **Play Console Android vitals** – crash rate, ANR rate, slow rendering, excessive wake-ups, startup.

</details>

### 18. What are Android vitals and why do they matter?

<details>
<summary>Answer</summary>

Play Console metrics from real users: **user-perceived crash rate** (bad-behaviour threshold 1.09%) and **user-perceived ANR rate** (0.47%), plus slow rendering, slow startup, excessive wake-ups and battery usage. Exceeding the thresholds can **reduce the app's visibility in Play Store** and show warnings to users. Interviewers like it when you mention monitoring vitals in production.

</details>

### 19. How do you reduce crashes / increase stability?

<details>
<summary>Answer</summary>

Crash reporting (**Crashlytics**, Sentry) with breadcrumbs and custom keys, staged rollouts with monitoring, null-safety discipline (no `!!`), process-death testing, handling configuration changes, defensive parsing (handle unexpected JSON), feature flags with a remote kill switch, and adding a regression test for each fix.

</details>

### 20. What is R8 and ProGuard?

<details>
<summary>Answer</summary>

**R8** is Android's compiler that replaces ProGuard. It does **shrinking** (removes unused code), **optimization** (inlining, removing dead branches), **obfuscation** (renames to short names) and **dexing** in one step. **Keep rules** (`proguard-rules.pro`) protect classes accessed through reflection (Gson models, JNI, some libraries). Upload the `mapping.txt` to Play or Crashlytics to de-obfuscate stack traces. **Full mode** (default since AGP 8) optimizes more aggressively.

</details>


---

## More Performance Questions

### 21. `HashMap` vs `ArrayMap` vs `SparseArray`?

<details>
<summary>Answer</summary>

- **`HashMap`** – an array of buckets plus an entry object per mapping. O(1) operations, but **memory-heavy** (an `Entry` object per item, and **autoboxing** for primitive keys).
- **`ArrayMap`** (Android) – two compact arrays: sorted hash codes plus interleaved keys and values. **Binary search**, O(log n). Much less memory, and no Entry objects. Best for **small maps (up to a few hundred items)**. Used internally by `Bundle`.
- **`SparseArray`** family (`SparseArray<E>`, `SparseIntArray`, `SparseBooleanArray`, `LongSparseArray`) – **int (or long) keys without boxing**, with sorted key arrays and binary search. Ideal for `Map<Int, X>` with a modest number of items (view IDs, positions).

Trade-off: binary search and array shifting on insert make them **slower than HashMap for large collections** (thousands of items). Use them for memory-sensitive, small collections.

</details>

### 22. How do you measure method execution time on Android?

<details>
<summary>Answer</summary>

- **Quick check in code:** Kotlin `measureTimeMillis { }` / `measureNanoTime { }` / `measureTime { }`, or `SystemClock.elapsedRealtimeNanos()` deltas. Debug only, since a single run is noisy.
- **Trace sections:** `Trace.beginSection("loadFeed")` … `endSection()` (or `trace("loadFeed") { }` from androidx.tracing), then look at them in a **Perfetto / Android Studio system trace**.
- **CPU Profiler** method tracing (instrumented, which adds overhead) or sampling.
- **Microbenchmark** (`BenchmarkRule`) for reliable numbers: warm-up, many iterations, a locked clock.
- Measure on **release-like builds** (R8, no debuggable flag). Debug builds are much slower.

</details>

### 23. Which app metrics should you monitor continuously?

<details>
<summary>Answer</summary>

- **Stability:** crash-free users and sessions, **user-perceived crash rate** and **ANR rate** (Play vitals thresholds).
- **Performance:** **cold/warm start time** (TTID/TTFD), **slow and frozen frames** (jank), screen load times, network latency and error rates.
- **Resources:** memory (OOMs, low-memory kills via `ApplicationExitInfo`), **battery** (excessive wake-ups, wake locks, background usage), app **size** (download and install).
- **Business/UX:** retention, funnel conversion, feature adoption, ratings.
- **Tools:** Play Console vitals, Firebase Crashlytics + Performance Monitoring, JankStats, Macrobenchmark in CI (regressions), custom traces, and `ApplicationExitInfo` for why the process died.

</details>

---

[⬅ Previous: RxJava](18-rxjava.md) · [⬅ Back to index](../README.md) · [Next: Testing ➡](20-testing.md)
