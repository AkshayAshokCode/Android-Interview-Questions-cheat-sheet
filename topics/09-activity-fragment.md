# Activity, Fragment & Lifecycle

[⬅ Back to index](../README.md)

Covers: Activity lifecycle, configuration changes, state saving, process death, tasks & launch modes, Fragment lifecycle & transactions, back navigation.

---

## Activity

### 1. What is an Activity and its lifecycle?

<details>
<summary>Answer</summary>

An Activity is a single screen with UI and the entry point for user interaction. Lifecycle callbacks:

| Callback | When | What to do |
|---|---|---|
| `onCreate()` | Created (once per instance) | `setContentView`/`setContent`, init ViewModel, restore state |
| `onStart()` | Becoming **visible** | Start UI-related observers |
| `onResume()` | In **foreground**, interactive | Start camera, animations, sensors |
| `onPause()` | Losing focus (dialog, multi-window, leaving) | Pause heavy work; keep it **fast** (next activity waits) |
| `onStop()` | **No longer visible** | Release UI resources, save data |
| `onRestart()` | Coming back from stopped | — |
| `onDestroy()` | Finishing or being recreated (config change) | Final cleanup |

States: Created → Started → Resumed → Paused → Stopped → Destroyed.
Use `isFinishing` / `isChangingConfigurations` in `onDestroy` to tell the cases apart.

</details>

### 2. What is the lifecycle sequence when navigating from Activity A to B and back?

<details>
<summary>Answer</summary>

**A → B (B is opaque):**
`A.onPause` → `B.onCreate` → `B.onStart` → `B.onResume` → `A.onStop`
(A's `onPause` runs first and B's start runs before A's `onStop`. That's why `onPause` must be fast.)

**Back from B:**
`B.onPause` → `A.onRestart` → `A.onStart` → `A.onResume` → `B.onStop` → `B.onDestroy`

If B is **transparent** or a dialog-themed Activity, A only gets `onPause` (it's still visible), not `onStop`.

</details>

### 3. Which lifecycle methods are called on rotation (configuration change)?

<details>
<summary>Answer</summary>

By default the Activity is **destroyed and recreated**:
`onPause` → `onStop` → `onSaveInstanceState` → `onDestroy` → `onCreate(savedState)` → `onStart` → `onRestoreInstanceState` → `onResume`.

The **ViewModel survives** (it's kept in the `ViewModelStore` through a non-config instance). Other configuration changes behave the same way: locale, dark mode, font scale, screen size, keyboard, multi-window resize.

</details>

### 4. What happens when you press Home vs Back?

<details>
<summary>Answer</summary>

- **Home:** `onPause` → `onStop` (+ `onSaveInstanceState`). The Activity stays in the back stack and returns to `onRestart`/`onStart`/`onResume`.
- **Back** (on the root launcher Activity): since **Android 12**, root launcher activities are **no longer finished** on Back. They're moved to the background like Home. On older versions, or for non-root activities: `onPause` → `onStop` → `onDestroy`.

</details>

### 5. When is only `onDestroy` called without `onPause`/`onStop`?

<details>
<summary>Answer</summary>

When you call **`finish()` inside `onCreate()`**: the system goes straight to `onDestroy()`.

</details>

### 6. What are `onSaveInstanceState()` and `onRestoreInstanceState()`?

<details>
<summary>Answer</summary>

- **`onSaveInstanceState(outState)`** – lets you save **small, transient UI state** (scroll position, text input, selected tab) into a Bundle before the Activity may be destroyed by the system. It's called **after `onStop()`** on API 28+ (before `onStop` on older versions). It's **not** called when the user explicitly finishes the Activity (Back / `finish()`).
- **`onRestoreInstanceState(savedState)`** – called **after `onStart()`**, only when there's saved state to restore.

Views that have an `id` save their own state automatically (EditText text, scroll position).

</details>

### 7. You can restore state in `onCreate()` or `onRestoreInstanceState()`. What's the difference?

<details>
<summary>Answer</summary>

- In `onCreate(savedInstanceState)` the Bundle is **null on first launch**, so you need a null check. It runs **before** `onStart()`.
- `onRestoreInstanceState()` is called **only when there is state to restore** (so no null check) and runs **after `onStart()`**, once the initialization is done. That's useful if restoration depends on things set up in `onStart`.

</details>

### 8. Config change vs process death – how do you handle each?

<details>
<summary>Answer</summary>

| | Config change (rotation) | Process death (killed in the background) |
|---|---|---|
| ViewModel | ✅ survives | ❌ lost |
| `onSaveInstanceState` Bundle | ✅ | ✅ (persisted by the system) |
| `SavedStateHandle` | ✅ | ✅ |
| Persistent storage (Room/DataStore) | ✅ | ✅ |

**Strategy:**
- UI state and data → **ViewModel**.
- Small essential state (IDs, query, scroll position) → **`SavedStateHandle`** / `rememberSaveable`.
- Important user data → **persist** it (Room/DataStore).

**Testing process death:** put the app in the background, then run `adb shell am kill <package>` (or enable "Don't keep activities" in Developer Options), and return to the app.

</details>

### 9. What does `android:configChanges` do? Should you use it?

<details>
<summary>Answer</summary>

It tells the system **not to recreate** the Activity for the listed changes (e.g. `orientation|screenSize|keyboardHidden`). `onConfigurationChanged()` is called instead, and you have to update resources yourself.

It's generally **discouraged** as a way to avoid handling state. Legitimate uses: video players, games, camera screens, or a **fully Compose** app, where Compose can react to configuration changes without recreation. It doesn't protect you from **process death**.

</details>

---

## Tasks & Launch Modes

### 10. What are a task and the back stack?

<details>
<summary>Answer</summary>

A **task** is a collection of activities the user interacts with for a job, arranged in a **back stack** (LIFO). Starting an Activity pushes it; Back pops it. Tasks can move to the background as a unit (shown in Recents). `taskAffinity` decides which task an Activity prefers to belong to.

</details>

### 11. Explain the launch modes with examples.

<details>
<summary>Answer</summary>

1. **`standard`** (default) – a **new instance every time**, even if one already exists. Stack A → B → B → B is possible.
2. **`singleTop`** – if an instance is **already at the top**, it's reused and **`onNewIntent()`** is called. Otherwise a new one is created.
   *Example:* a search results screen or a notification-target screen. Tapping again shouldn't stack duplicates.
3. **`singleTask`** – only **one instance in the task**. If it exists, the system brings that task forward, **clears every activity above it**, and calls `onNewIntent()`. Otherwise it's created as the root of a new task (or according to its affinity).
   *Example:* a Home/Main screen. Stack A → B → C, then starting A (singleTask) gives just A.
4. **`singleInstance`** – like singleTask, but the Activity is the **only member of its task**; anything it launches goes into another task.
   *Example:* a launcher, or an incoming call screen.
5. **`singleInstancePerTask`** (Android 12+) – the root of a task, but multiple instances can exist in **different tasks** (with `FLAG_ACTIVITY_MULTIPLE_TASK`).

Intent flags can override these at runtime.

</details>

### 12. What are common Intent flags?

<details>
<summary>Answer</summary>

- `FLAG_ACTIVITY_NEW_TASK` – start in a new task (required when starting from a non-Activity context). Behaves like singleTask together with affinity.
- `FLAG_ACTIVITY_CLEAR_TOP` – if the Activity exists in the stack, pop everything above it.
- `FLAG_ACTIVITY_SINGLE_TOP` – same as the `singleTop` launch mode.
- `FLAG_ACTIVITY_CLEAR_TASK` (with `NEW_TASK`) – clear the whole task before starting. Typical **after logout/login**: `NEW_TASK | CLEAR_TASK`.
- `FLAG_ACTIVITY_NO_HISTORY`, `FLAG_ACTIVITY_REORDER_TO_FRONT`.

</details>

---

## Fragment

### 13. What is a Fragment and its lifecycle?

<details>
<summary>Answer</summary>

A Fragment is a **reusable portion of UI** with its own lifecycle, hosted by an Activity (or by another Fragment). It has **two lifecycles**: the Fragment's own lifecycle and its **View's lifecycle** (`viewLifecycleOwner`).

Order:
`onAttach` → `onCreate` → `onCreateView` → `onViewCreated` → `onViewStateRestored` → `onStart` → `onResume` → `onPause` → `onStop` → `onSaveInstanceState` → **`onDestroyView`** → `onDestroy` → `onDetach`.

Key points:
- When a fragment is replaced and added to the back stack, only its **view** is destroyed (`onDestroyView`). The Fragment instance survives and gets `onCreateView` again when you come back.
- `onActivityCreated()` is **deprecated**. Use `onViewCreated()`, or a `LifecycleObserver` on the activity.

</details>

### 14. Why should you use `viewLifecycleOwner` in Fragments? How do you avoid view-binding leaks?

<details>
<summary>Answer</summary>

The Fragment can outlive its View (back stack). If you observe LiveData/Flow with `this` (the fragment) as the owner, observers stay active after `onDestroyView` and **pile up** every time the view is recreated, and they can touch views that no longer exist.

✅ `viewModel.data.observe(viewLifecycleOwner) { }` and `viewLifecycleOwner.lifecycleScope`.

**ViewBinding leak fix:**
```kotlin
private var _binding: FragmentHomeBinding? = null
private val binding get() = _binding!!
override fun onDestroyView() { super.onDestroyView(); _binding = null }
```

</details>

### 15. When should you use a Fragment rather than an Activity?

<details>
<summary>Answer</summary>

- **Reusable UI pieces** used across multiple screens or activities.
- **Adaptive layouts** – list and detail side by side on tablets/foldables, separate screens on phones.
- **Single-Activity architecture** with the Navigation component: one Activity, many destinations (Fragments or composables). Lighter than activities, with easy shared ViewModels and transitions.
- Swipe tabs with ViewPager2, bottom sheets, dialogs (`DialogFragment`).

In **Compose** apps, composables + Navigation mostly replace Fragments.

</details>

### 16. `add` vs `replace` fragment transaction?

<details>
<summary>Answer</summary>

- **`replace`** – removes the existing fragment(s) in the container (their view is destroyed: `onDestroyView`; if not added to the back stack, the fragment is destroyed) and adds the new one. On Back, the old fragment's `onCreateView` runs again.
- **`add`** – adds the new fragment **on top**. The existing fragment stays **alive, with its view** (it is **not** paused or stopped). On Back, `onCreateView` is **not** called for the old fragment. It costs more memory, and touches can pass through to the fragment underneath if the top one has no background.

</details>

### 17. What does `addToBackStack()` do?

<details>
<summary>Answer</summary>

It saves the transaction to the FragmentManager's back stack, so pressing **Back reverses the transaction** (brings back the previous fragment) instead of finishing the Activity. Without it, the replaced fragment is destroyed. `popBackStack()` reverses it programmatically.

</details>

### 18. `commit()` vs `commitNow()` vs `commitAllowingStateLoss()`?

<details>
<summary>Answer</summary>

- `commit()` – **asynchronous**: scheduled on the main thread's next loop.
- `commitNow()` – **synchronous**: runs immediately. It can't be added to the back stack.
- `commitAllowingStateLoss()` – allowed **after `onSaveInstanceState`**. Calling `commit()` at that point throws `IllegalStateException: Can not perform this action after onSaveInstanceState`. Use it only if losing the transaction on process death is acceptable.
- `executePendingTransactions()` forces pending commits to run.

</details>

### 19. What is the difference between FragmentPagerAdapter and FragmentStatePagerAdapter? (and ViewPager2)

<details>
<summary>Answer</summary>

- **FragmentPagerAdapter** – keeps **fragment instances in memory**. Only views are destroyed when off-screen. Good for a few static pages (tabs).
- **FragmentStatePagerAdapter** – **destroys fragments** that aren't visible and keeps only their **saved state**. Good for many pages.
- Both are **deprecated**. Use **ViewPager2** with **`FragmentStateAdapter`** (built on RecyclerView, supports vertical paging, RTL and `DiffUtil`). In Compose, use `HorizontalPager`.

</details>

### 20. What is a retained Fragment?

<details>
<summary>Answer</summary>

`setRetainInstance(true)` kept the fragment **instance** across configuration changes (only its view was recreated). It was used to hold network tasks or objects through rotation. It's now **deprecated**. Use a **ViewModel**, which exists for exactly this purpose.

</details>

### 21. Why must Fragments have an empty constructor? How do you pass arguments?

<details>
<summary>Answer</summary>

After process death or a config change, the system **recreates fragments by reflection with the no-arg constructor**, so constructor parameters would be lost. Pass data through `arguments` (Bundle):

```kotlin
companion object {
    fun newInstance(id: String) = DetailFragment().apply { arguments = bundleOf("id" to id) }
}
```

For constructor injection, use a `FragmentFactory` (or Hilt's `@AndroidEntryPoint` with field injection).

</details>

### 22. How do Fragments communicate?

<details>
<summary>Answer</summary>

- A **shared ViewModel** scoped to the Activity (`activityViewModels()`) or to a nav graph (`navGraphViewModels()`).
- The **Fragment Result API**: `setFragmentResult("key", bundle)` and `setFragmentResultListener("key")`.
- Avoid direct references and callbacks to the host Activity (tight coupling).

</details>

### 23. `childFragmentManager` vs `parentFragmentManager`?

<details>
<summary>Answer</summary>

- `parentFragmentManager` – the manager that holds **this** fragment (the Activity's `supportFragmentManager` for top-level fragments).
- `childFragmentManager` – manages fragments **nested inside** this fragment. Use it for nested fragments, such as a ViewPager2 inside a fragment.

</details>

### 24. What is the `Lifecycle` component / `LifecycleObserver`?

<details>
<summary>Answer</summary>

`Lifecycle` (androidx.lifecycle) exposes the **state** and **events** of an Activity, Fragment or the whole process (`ProcessLifecycleOwner`). Components observe it to manage themselves, instead of piling code into lifecycle callbacks:

```kotlin
class LocationTracker : DefaultLifecycleObserver {
    override fun onStart(owner: LifecycleOwner) { start() }
    override fun onStop(owner: LifecycleOwner) { stop() }
}
lifecycle.addObserver(LocationTracker())
```

`ProcessLifecycleOwner` lets you detect when the **app** moves to the foreground or background.

</details>

### 25. How do you handle Back press in modern Android? What is predictive back?

<details>
<summary>Answer</summary>

`onBackPressed()` is **deprecated** (API 33+). Use **`OnBackPressedDispatcher`**:

```kotlin
onBackPressedDispatcher.addCallback(viewLifecycleOwner) {
    if (hasUnsavedChanges) showDiscardDialog() else { isEnabled = false; onBackPressedDispatcher.onBackPressed() }
}
```

In Compose, use `BackHandler { }` (or `PredictiveBackHandler` for progress events).

**Predictive back** (Android 13+, opt in with `android:enableOnBackInvokedCallback="true"`; on by default for apps targeting Android 16): the user sees a **preview** of the destination (home screen, previous Activity, or fragment) while swiping. It requires the callback-based API, because the system needs to know *in advance* whether the app will handle Back.

</details>

### 26. What is a DialogFragment? Why not a plain Dialog?

<details>
<summary>Answer</summary>

`DialogFragment` wraps a Dialog in a Fragment, so it **survives configuration changes** and is managed by the FragmentManager lifecycle. A plain `AlertDialog` is dismissed on rotation and can leak the window (`WindowLeaked`). `BottomSheetDialogFragment` is the bottom-sheet equivalent.

</details>


---

## More Activity Questions

### 27. Why do we call `setContentView()` in `onCreate()`?

<details>
<summary>Answer</summary>

`onCreate()` is called **once per Activity instance**, so it's the right place for one-time setup. `setContentView()` **inflates the layout** (parses the XML and creates the view hierarchy), which is expensive. Doing it in `onStart`/`onResume` would rebuild the UI every time the Activity becomes visible, losing view state and wasting work. Views also have to exist before you can find them or bind them in `onCreate`, and before the first frame is drawn. (In Compose, `setContent {}` plays the same role.)

</details>

### 28. What is the difference between `onCreate()` and `onStart()`?

<details>
<summary>Answer</summary>

| `onCreate()` | `onStart()` |
|---|---|
| Called **once** when the Activity is created | Called **every time** the Activity becomes **visible** (after `onCreate` and after `onRestart`) |
| One-time init: layout, ViewModel, bindings, restore the saved Bundle | Start things that only matter while visible: register receivers or listeners, start UI-related collection (`repeatOnLifecycle(STARTED)`) |
| Matched by `onDestroy()` | Matched by `onStop()` |

</details>

### 29. What is the relationship between an Activity and a Fragment?

<details>
<summary>Answer</summary>

- An **Activity** is an app **entry point** (it's in the manifest and can be started by the system or other apps) that owns a **window**.
- A **Fragment** is a **modular piece of UI and behaviour** that must be **hosted** by an Activity (or by another Fragment). It can't exist on its own.
- The fragment's lifecycle is **tied to its host**: it can never be in a "higher" state than the Activity. If the Activity is stopped, so are its fragments.
- One Activity can host many fragments (single-Activity architecture), and fragments can be reused across activities.
- Fragments have their own back stack (managed by the `FragmentManager`), and a separate **view lifecycle**.

</details>

---

[⬅ Previous: Android Fundamentals](08-android-fundamentals.md) · [⬅ Back to index](../README.md) · [Next: UI – Views & XML ➡](10-ui-views.md)
