# What's New & Trending in Android

[⬅ Back to index](../README.md)

Interviewers love asking *"What's new in Android?"* or *"What recent changes have you worked with?"*. This section covers the trending topics from roughly 2024 onward. Always check the official release notes before an interview for the very latest.

---

## Platform Changes

### 1. What are the key changes in Android 14 (API 34)?

<details>
<summary>Answer</summary>

- **Foreground service types required**, with type-specific permissions.
- **Partial photo/video access** ("Select photos").
- `SCHEDULE_EXACT_ALARM` **denied by default** for new installs; `USE_EXACT_ALARM` only for alarm and calendar apps.
- Runtime-registered receivers must specify `RECEIVER_EXPORTED` / `RECEIVER_NOT_EXPORTED`.
- **Non-linear font scaling** up to 200%.
- Restrictions on implicit intents and mutable PendingIntents; minimum installable targetSdk raised (23).
- Screenshot detection API, Credential Manager integration, predictive back animations (developer option), regional preferences.
- **User-initiated data transfer jobs.**

</details>

### 2. What are the key changes in Android 15 (API 35)?

<details>
<summary>Answer</summary>

- **Edge-to-edge enforced** for apps targeting 35: the app draws behind the system bars, so you have to handle insets.
- **16 KB page size** support (native libraries must be aligned; required on Play for new apps and updates targeting 15+).
- **Foreground service changes**: time limits for `dataSync`/`mediaProcessing`; restrictions on starting FGS from `BOOT_COMPLETED`.
- **Private space** (a separate profile for sensitive apps).
- **Partial screen sharing**, improved **predictive back** (system animations enabled for opted-in apps).
- Safer intents, `elegantTextHeight` default, ApplicationStartInfo API (startup reasons and timings).

</details>

### 3. What are the key changes in Android 16 (API 36)?

<details>
<summary>Answer</summary>

- **Large screens / adaptive**: for apps targeting 36, **orientation, resizability and aspect-ratio restrictions are ignored** on displays ≥ 600 dp. Apps must handle being resized.
- **Edge-to-edge opt-out removed** (`windowOptOutEdgeToEdgeEnforcement` no longer works).
- **Predictive back** on by default for apps targeting 36 (`onBackPressed` no longer called; use `OnBackPressedCallback`).
- **Progress-centric notifications / Live Updates** (`Notification.ProgressStyle`) for ride-sharing, delivery and navigation.
- JobScheduler quota changes, adaptive refresh rate, health permissions moving to Health Connect granular permissions.
- A **faster release cadence**: Android 16 shipped in Q2 2025, with a minor SDK release later in the year.

</details>

### 4. What is edge-to-edge and why is it important now?

<details>
<summary>Answer</summary>

Apps draw content **behind the status and navigation bars** for an immersive look. It's enforced since targetSdk 35. Call `enableEdgeToEdge()` and apply **window insets** (`Scaffold` padding, `WindowInsets.safeDrawing`, `ViewCompat.setOnApplyWindowInsetsListener`). Watch for: FABs behind the gesture bar, text under the status bar, the IME covering input fields (`imePadding()`), and display cutouts. See [UI Q23](10-ui-views.md).

</details>

### 5. What is predictive back?

<details>
<summary>Answer</summary>

A back gesture that shows a **preview** of where Back will go (home screen, previous Activity, previous fragment or composable) before the user finishes swiping. Apps have to use the **ahead-of-time** API (`OnBackPressedCallback`, `BackHandler`, `PredictiveBackHandler`), because the system must know in advance whether the app will intercept Back. Overriding `onBackPressed()` breaks it. See [Activity Q25](09-activity-fragment.md).

</details>

### 6. What does "adaptive apps" mean (large screens, foldables, XR)?

<details>
<summary>Answer</summary>

Apps should adapt to **any window size and posture**: phones, foldables, tablets, ChromeOS, desktop windowing, cars and **Android XR** headsets.
- **Window size classes** (Compact/Medium/Expanded, plus Large and Extra-large widths).
- **Compose Material 3 Adaptive**: `NavigationSuiteScaffold` (switches between bottom bar, rail and drawer automatically), `ListDetailPaneScaffold`, `SupportingPaneScaffold`.
- Don't lock orientation. Handle resizing and multi-window, keyboard/mouse input, and fold postures (Jetpack WindowManager).
- Google Play surfaces **large-screen quality** ratings.

</details>

---

## Kotlin & Compose

### 7. What's new in Kotlin (K2 and Kotlin 2.x)?

<details>
<summary>Answer</summary>

- **K2 compiler** (stable since Kotlin 2.0): up to ~2× faster compilation and smarter smart casts.
- The **Compose compiler** ships with Kotlin (`org.jetbrains.kotlin.plugin.compose`).
- Newer language features: guard conditions in `when`, non-local `break`/`continue`, multi-dollar interpolation, **context parameters** (preview), explicit backing fields (experimental), nested type aliases.
- **KSP2**, the Kotlin Power-assert plugin, improved Kotlin/Wasm and Swift export (KMP).

</details>

### 8. What is Kotlin Multiplatform (KMP)? Why is it trending?

<details>
<summary>Answer</summary>

KMP lets you **share Kotlin code across Android, iOS, desktop, web and server**, while still writing native UI where you want it. It's **stable** and **officially supported by Google** for sharing business logic.

- Structure: `commonMain` (shared), `androidMain`, `iosMain` (platform-specific), using the **`expect`/`actual`** mechanism for platform APIs.
- KMP-ready libraries: **Ktor** (network), **kotlinx.serialization**, **kotlinx.coroutines**, **SQLDelight / Room (KMP)**, **DataStore (KMP)**, **Koin**, **Jetpack ViewModel and Lifecycle (KMP)**, **Paging (KMP)**.
- **Compose Multiplatform** (JetBrains) also shares the **UI**. Stable on iOS since 2025.
- Big apps use it in production (Google Docs/Workspace shares business logic with KMP, along with Netflix, McDonald's, Cash App and others).

**KMP vs Flutter/React Native:** KMP gives native performance and native interop, and can be adopted **incrementally** (share only the data layer first). Flutter shares everything, including the UI, using Dart and its own renderer.

</details>

### 9. What is `expect`/`actual`?

<details>
<summary>Answer</summary>

`expect` declares an API in common code, and each platform provides an `actual` implementation:

```kotlin
// commonMain
expect fun platformName(): String
// androidMain
actual fun platformName() = "Android ${Build.VERSION.SDK_INT}"
// iosMain
actual fun platformName() = UIDevice.currentDevice.systemName()
```

Often, an **interface + DI** gives a cleaner way to do the same thing.

</details>

### 10. What's new in Jetpack Compose recently?

<details>
<summary>Answer</summary>

- **Strong skipping mode** on by default (fewer stability issues).
- **Shared element transitions** (`SharedTransitionLayout`), `Modifier.animateItem()` in lazy lists.
- **Type-safe Navigation** (`@Serializable` routes) and **Navigation 3** (a back stack you own; adaptive scenes).
- **Material 3 Adaptive** layouts, **Material 3 Expressive** (new components and motion).
- Performance work: faster lazy lists, `Modifier.Node` APIs (efficient custom modifiers), pausable composition / prefetch.
- New text features: autosize text, `TextFieldState`-based `BasicTextField`.
- **Compose Preview Screenshot Testing**, live edit, and recomposition highlighting in Android Studio.
- **Glance** (Compose-style widgets), **Compose for Wear OS**, **Compose for TV**.

</details>

---

## AI on Android

### 11. How can you add AI / LLM features to an Android app?

<details>
<summary>Answer</summary>

**On-device (private, offline, no server cost):**
- **Gemini Nano** through **ML Kit GenAI APIs** (summarization, proofreading, rewriting, image description) and the AICore system service, on supported devices.
- **ML Kit** classic APIs: text recognition, barcode scanning, face detection, translation.
- **LiteRT** (formerly TensorFlow Lite) and **MediaPipe** for running custom models.

**Cloud (more powerful models):**
- **Firebase AI Logic** (formerly Vertex AI in Firebase) to call Gemini models from the app, **without embedding API keys**. It works with Firebase App Check.
- Your own backend calling any LLM provider.

**Design considerations:** streaming responses into the UI (Flow), latency and loading states, cost, privacy (what data leaves the device), safety and content filtering, hallucination handling, fallbacks when the device doesn't support a feature, and **never shipping LLM API keys in the APK**.

</details>

### 12. What is Gemini in Android Studio?

<details>
<summary>Answer</summary>

An AI coding assistant built into Android Studio: code completion and generation, explaining crashes from **App Quality Insights** (Crashlytics/vitals), generating Compose previews and UI from images, commit messages, and agent mode for multi-step tasks. It's good to mention how you use AI tools responsibly (review the generated code, check for security issues).

</details>

---

## Other Trending Topics

### 13. What is Credential Manager / passkeys?

<details>
<summary>Answer</summary>

A single Jetpack API for **passkeys, passwords and federated sign-in (Sign in with Google)**. It replaces the older Smart Lock and Google Sign-In APIs (now deprecated). Passkeys are phishing-resistant and passwordless (public-key cryptography). See [Security Q16](21-security-permissions.md).

</details>

### 14. What is the Photo Picker and why does Google push it?

<details>
<summary>Answer</summary>

It lets users share selected photos and videos **without the app getting broad storage access**. Google Play policy now **restricts `READ_MEDIA_IMAGES/VIDEO`** to apps whose core function needs broad access. Everyone else should use the Photo Picker. See [Storage Q14](16-data-storage.md).

</details>

### 15. What is Health Connect?

<details>
<summary>Answer</summary>

A platform service (part of the OS since Android 14) where health and fitness apps **store and share data** (steps, heart rate, sleep, exercise) with granular user permissions. It's replacing Google Fit APIs.

</details>

### 16. What are Baseline Profiles and why are they trending?

<details>
<summary>Answer</summary>

They're the main lever for **startup and jank improvements** in modern apps (often around 20–30%), especially for Compose apps. Google recommends every app ship them. See [Performance Q13](19-performance-memory.md).

</details>

### 17. What is Media3?

<details>
<summary>Answer</summary>

The unified Jetpack media library: **ExoPlayer** + `MediaSession` + `MediaSessionService` + transformer/editing APIs. It replaces the standalone ExoPlayer and the older MediaCompat APIs, and has Compose UI components for players.

</details>

### 18. What is Android XR?

<details>
<summary>Answer</summary>

Google's Android platform for **extended reality headsets and glasses**. Existing Android apps run as 2D panels. With the **Jetpack XR SDK** (Compose for XR spatial panels, ARCore for Jetpack XR, SceneCore) apps can add spatial UI and 3D content. It's another reason to build **adaptive** layouts.

</details>

### 19. What are recent Google Play policy requirements every developer should know?

<details>
<summary>Answer</summary>

- **Target API level requirement** (new apps and updates must target a recent API level, roughly within a year of the latest release).
- **16 KB page size** compatibility for apps with native code.
- **Data safety** section and **account deletion** requirements (apps with accounts must offer in-app and web deletion).
- **Photo/video permission** restrictions, foreground service type declarations, exact alarm restrictions.
- New personal developer accounts must run **closed testing** before production.
- Developer verification requirements for apps distributed on certified devices (rolling out from 2026).

</details>

### 20. How do you stay up to date with Android? (Common interview question)

<details>
<summary>Answer</summary>

Mention concrete sources: the **Android Developers Blog**, the *Now in Android* app and podcast, the **Google I/O** and Android Dev Summit talks, the Kotlin blog and KotlinConf, Android Weekly / Kotlin Weekly newsletters, AOSP release notes and behaviour-change docs for each API level, the official samples (Now in Android, Jetcaster), and experimenting in side projects. Name a specific recent feature you tried.

</details>


### 21. Native vs Flutter vs React Native vs Kotlin Multiplatform?

<details>
<summary>Answer</summary>

| | Native (Kotlin/Swift) | Flutter | React Native | KMP (+ Compose Multiplatform) |
|---|---|---|---|---|
| Language | Kotlin / Swift | Dart | JavaScript/TypeScript | Kotlin |
| UI | Platform UI (Compose/SwiftUI) | Its own rendering engine (Impeller), same pixels everywhere | Native components through the new architecture (Fabric/JSI) | Native UI per platform, **or** shared Compose UI |
| Shared code | None | UI + logic | UI + logic | **Logic first**, UI optional |
| Performance | Best | Very good | Good (JSI improved it) | Native |
| Access to new platform APIs | Day one | Plugins/platform channels | Native modules | Direct (expect/actual) |
| Adoption | — | Full app rewrite | Full app or brownfield | **Incremental**: add a shared module to existing apps |

A good interview answer: "It depends on team skills, the performance and UX bar, how much code can really be shared, and whether you're starting fresh or adding to existing native apps. KMP is attractive for sharing business logic while keeping native UX."

</details>

---

[⬅ Previous: System Design](23-system-design.md) · [⬅ Back to index](../README.md) · [Next: Coding & Scenario Questions ➡](25-coding-scenarios.md)
