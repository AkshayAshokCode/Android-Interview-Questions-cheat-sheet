# UI – Views, XML Layouts & RecyclerView

[⬅ Back to index](../README.md)

Covers: View vs ViewGroup, layouts, the rendering pipeline, custom views, RecyclerView, ViewBinding, touch events, themes, accessibility, edge-to-edge.

---

## Views & Layouts

### 1. What are Views and ViewGroups? How are they different?

<details>
<summary>Answer</summary>

- **View** – the basic UI building block: a rectangle that draws itself and handles events (`TextView`, `Button`, `ImageView`). `android.view.View` is the base class of all UI widgets.
- **ViewGroup** – an invisible **container** that holds Views or other ViewGroups and decides how to **measure and position** its children (`LinearLayout`, `FrameLayout`, `ConstraintLayout`). `ViewGroup` extends `View` (Composite pattern).

</details>

### 2. How does Android draw a View? (measure → layout → draw)

<details>
<summary>Answer</summary>

The view tree is traversed in three passes, triggered by `ViewRootImpl` on every **vsync** through `Choreographer`:
1. **Measure** (`onMeasure`) – each view decides its size based on the parent's `MeasureSpec` (mode: `EXACTLY`, `AT_MOST`, `UNSPECIFIED`). Must call `setMeasuredDimension()`.
2. **Layout** (`onLayout`) – parents position their children (`child.layout(l, t, r, b)`).
3. **Draw** (`onDraw`) – background → content → children (`dispatchDraw`) → decorations (scrollbars).

The frame is then rendered by the **RenderThread** with the GPU (hardware acceleration). To hit 60 fps, each frame must finish in **16 ms** (8 ms at 120 Hz).

</details>

### 3. `invalidate()` vs `requestLayout()`?

<details>
<summary>Answer</summary>

- `invalidate()` – the view's **appearance** changed (color, text drawn on a canvas). Triggers only **`onDraw`**. `postInvalidate()` does the same from a background thread.
- `requestLayout()` – the view's **size or position** changed. Triggers **measure + layout** (and usually draw) up the tree, which is more expensive.

</details>

### 4. What are MeasureSpec modes?

<details>
<summary>Answer</summary>

- **EXACTLY** – the parent fixed the size (`match_parent` or a fixed dp).
- **AT_MOST** – the view can be as large as it wants, up to this size (`wrap_content`).
- **UNSPECIFIED** – no constraint (e.g. inside a ScrollView along the scroll direction).

</details>

### 5. How do you create a custom View?

<details>
<summary>Answer</summary>

1. Extend `View` (or an existing widget). Provide constructors; use `@JvmOverloads constructor(context, attrs = null, defStyleAttr = 0)`.
2. Declare custom attributes in `res/values/attrs.xml` (`<declare-styleable>`) and read them with `context.withStyledAttributes(...)`.
3. Override `onMeasure` (support `wrap_content`), `onDraw(canvas)` (draw with `Paint`, `Path`), and `onTouchEvent` if the view is interactive.
4. **Performance rules:** don't allocate objects (`Paint`, `Path`) in `onDraw`. Create them once.
5. Save state in `onSaveInstanceState()`/`onRestoreInstanceState()`, and add accessibility support.

A **compound view** (inflating an XML layout of existing views) is often easier than drawing by hand.

</details>

### 6. LinearLayout vs RelativeLayout vs ConstraintLayout vs FrameLayout?

<details>
<summary>Answer</summary>

- **FrameLayout** – stacks children on top of each other. Good for a single child or overlays.
- **LinearLayout** – a single row or column. `layout_weight` causes a **double measure pass**, and nested LinearLayouts get expensive.
- **RelativeLayout** – positions children relative to each other or the parent. Always measures **twice** (legacy).
- **ConstraintLayout** – a **flat hierarchy** for complex UIs, with constraints, chains, guidelines, barriers, ratios and `MotionLayout` animations. Recommended for complex XML screens.

</details>

### 7. How do you optimize layouts? What are `<include>`, `<merge>`, `ViewStub`?

<details>
<summary>Answer</summary>

- Keep the hierarchy **flat and shallow** (ConstraintLayout). Avoid nested weights.
- `<include>` – reuse layouts.
- `<merge>` – removes a redundant root ViewGroup when the layout is included.
- **`ViewStub`** – a zero-size placeholder that inflates its layout **only when needed** (error views, rarely used sections).
- Remove **overdraw** (unneeded backgrounds). Check it with "Debug GPU Overdraw" in Developer Options.
- Tools: **Layout Inspector**, Profile GPU Rendering, Perfetto.

</details>

### 8. What is the difference between `View.GONE`, `INVISIBLE`, `VISIBLE`?

<details>
<summary>Answer</summary>

- `VISIBLE` – shown.
- `INVISIBLE` – hidden but **still takes up space** in the layout.
- `GONE` – hidden and **takes no space** (layout is recalculated).

</details>

### 9. `padding` vs `margin`?

<details>
<summary>Answer</summary>

**Padding** is space **inside** the view's border (between border and content); it's part of the view and of its clickable area. **Margin** is space **outside** the view's border, between it and its neighbours.

</details>

### 10. What is ViewBinding vs DataBinding vs `findViewById` vs synthetics?

<details>
<summary>Answer</summary>

- **`findViewById`** – manual, no null or type safety, and a tree lookup each time.
- **Kotlin synthetics** – **deprecated and removed**.
- **ViewBinding** – generates a binding class per layout with **null-safe, type-safe** references. No annotation processing, so it's fast. ✅ Recommended for Views.
- **DataBinding** – ViewBinding plus **binding expressions in XML** (`@{viewModel.name}`), two-way binding (`@={}`) and `BindingAdapter`s. Slower builds, harder-to-debug logic in XML, and it uses kapt. Less popular now; Compose replaces it.

</details>

---

## RecyclerView

### 11. How does RecyclerView work? Why is it better than ListView?

<details>
<summary>Answer</summary>

RecyclerView shows large data sets efficiently by **recycling item views**. Only enough ViewHolders for the visible items (plus a few extra) are created. Views that scroll off-screen are **rebound** with new data instead of being inflated again.

Components:
- **Adapter** – creates ViewHolders (`onCreateViewHolder`) and binds data (`onBindViewHolder`).
- **ViewHolder** – caches the item's view references.
- **LayoutManager** – positions items: `LinearLayoutManager`, `GridLayoutManager`, `StaggeredGridLayoutManager`.
- **ItemDecoration** (dividers, spacing), **ItemAnimator**, **ItemTouchHelper** (swipe/drag).

**vs ListView:** the ViewHolder pattern is **enforced**, layout managers are pluggable (grid, horizontal), there are fine-grained update notifications with animations, and it has better caching. ListView only did vertical lists, and ViewHolder was optional.

</details>

### 12. Explain RecyclerView's caching / recycling mechanism.

<details>
<summary>Answer</summary>

Lookup order when a position needs a view:
1. **Scrap** (attached/changed scrap) – views temporarily detached during a layout pass. Reused without rebinding.
2. **Cached views** (`mCachedViews`, default size **2**) – recently scrolled-off views kept **with their data**. Reused **without rebinding** if the same position comes back.
3. **ViewCacheExtension** – optional, developer-defined.
4. **RecycledViewPool** – ViewHolders grouped by **viewType** (default 5 per type). Need **rebinding** (`onBindViewHolder`).
5. Otherwise, `onCreateViewHolder` (inflate).

Tips: `setItemViewCacheSize()`, a shared `RecycledViewPool` for nested RecyclerViews, `setHasFixedSize(true)` when item changes don't affect the RecyclerView's size, and `GridLayoutManager` prefetch.

</details>

### 13. What is DiffUtil and ListAdapter? Why not `notifyDataSetChanged()`?

<details>
<summary>Answer</summary>

`notifyDataSetChanged()` rebinds **everything**, breaks animations, and can't tell what changed.

**DiffUtil** computes the **minimal set of updates** between the old and new lists (Myers' diff algorithm), then dispatches precise `notifyItemInserted/Removed/Changed/Moved` calls:

```kotlin
class UserDiff : DiffUtil.ItemCallback<User>() {
    override fun areItemsTheSame(o: User, n: User) = o.id == n.id      // same identity
    override fun areContentsTheSame(o: User, n: User) = o == n           // same content
}
class UserAdapter : ListAdapter<User, UserVH>(UserDiff()) { ... }
adapter.submitList(newList)   // diff computed on a background thread (AsyncListDiffer)
```

Always submit a **new list instance**. Mutating the same list and resubmitting it won't trigger any updates.

</details>

### 14. How do you implement multiple view types in RecyclerView?

<details>
<summary>Answer</summary>

Override `getItemViewType(position)` to return a type per item (often a sealed class mapped to layout IDs), create the matching ViewHolder in `onCreateViewHolder(parent, viewType)`, and bind accordingly. For complex screens, use **ConcatAdapter** (combine several adapters, e.g. header + list + footer) or adapter-delegate libraries.

</details>

### 15. How do you implement pagination / endless scroll?

<details>
<summary>Answer</summary>

- Recommended: **Paging 3** (`PagingSource`, `Pager`, `PagingDataAdapter`, with `RemoteMediator` for network + DB). It handles loading states, retry and caching.
- Manual: an `addOnScrollListener`. When `lastVisibleItem + threshold >= totalItemCount` and you're not already loading, fetch the next page.

</details>

### 16. Why do images flicker or show wrong data in RecyclerView?

<details>
<summary>Answer</summary>

Because views are recycled. If an async image load or a state change finishes after the ViewHolder has been rebound to another item, it shows the wrong data. Fixes:
- **Always set every view state in `onBindViewHolder`** (including the "else" branches, e.g. reset checkboxes).
- Use image libraries (Coil/Glide). They cancel the previous request for that `ImageView`.
- Use **stable IDs** (`setHasStableIds(true)` + `getItemId`), and implement `areContentsTheSame` correctly.
- Implement `getChangePayload` to avoid full rebinds that cause flicker.

</details>

### 17. Where should click listeners be set in RecyclerView?

<details>
<summary>Answer</summary>

Set them **once in `onCreateViewHolder`** (or in the ViewHolder's `init`), and read the current item with `bindingAdapterPosition` (check for `NO_POSITION`). Setting them in `onBindViewHolder` creates new listener objects on every bind. Pass a lambda `(Item) -> Unit` to the adapter, not a Context or Activity.

</details>

---

## Touch Events

### 18. Explain the touch event dispatch flow.

<details>
<summary>Answer</summary>

`Activity.dispatchTouchEvent` → `Window` → root `ViewGroup.dispatchTouchEvent` → **`onInterceptTouchEvent`** (can the parent steal the event?) → child `View.dispatchTouchEvent` → `OnTouchListener.onTouch` → **`onTouchEvent`** (which also handles click and long click).

- Returning `true` = **consumed**. The view then receives the rest of the gesture (MOVE, UP).
- If nobody consumes `ACTION_DOWN`, the event **bubbles back up** to the parent's `onTouchEvent`, and finally the Activity's.
- A parent can intercept mid-gesture (e.g. when a ScrollView detects a scroll), and the child receives `ACTION_CANCEL`. A child can block this with `requestDisallowInterceptTouchEvent(true)`.

</details>

### 19. How do you resolve nested scrolling conflicts?

<details>
<summary>Answer</summary>

Use views that support nested scrolling (`NestedScrollView`, `CoordinatorLayout`, RecyclerView), handle `onInterceptTouchEvent` based on scroll direction, or use `requestDisallowInterceptTouchEvent`. **Avoid RecyclerView inside a NestedScrollView** with `wrap_content`: it kills recycling because every item gets laid out. Use a single RecyclerView with multiple view types, or ConcatAdapter, instead.

</details>

---

## Styling, Theming & Accessibility

### 20. Style vs Theme?

<details>
<summary>Answer</summary>

- A **style** is a set of attributes for **a single View** (`style="@style/PrimaryButton"`).
- A **theme** is applied to an **Activity or the app** (or a view subtree through `android:theme`). It defines theme attributes (`?attr/colorPrimary`) that all views inherit, and also affects window properties.

Use **Material 3** themes (`Theme.Material3.DayNight`) and **dynamic color** (Material You, Android 12+).

</details>

### 21. How do you support dark mode?

<details>
<summary>Answer</summary>

Use a `DayNight` theme, `values-night/` resources, and **theme attributes instead of hardcoded colors**. Switch with `AppCompatDelegate.setDefaultNightMode()`. In Compose, use `isSystemInDarkTheme()` with separate light and dark color schemes in `MaterialTheme`.

</details>

### 22. How do you support multiple screen sizes / foldables?

<details>
<summary>Answer</summary>

- Use dp/sp, `ConstraintLayout`, and flexible layouts. Avoid fixed sizes.
- Alternative resources: `layout-sw600dp`, `values-w840dp`.
- **Window size classes** (Compact / Medium / Expanded) from `material3-window-size-class`/`material3-adaptive`, plus **canonical layouts** (list-detail, supporting pane, feed).
- Jetpack **WindowManager** for fold and hinge info.
- Don't lock orientation. Android 16 **ignores orientation and resizability restrictions on large screens** for apps targeting API 36.

</details>

### 23. What is edge-to-edge and how do you handle window insets?

<details>
<summary>Answer</summary>

Edge-to-edge means the app draws **behind the system bars** (status and navigation bars). It's **enforced for apps targeting Android 15 (API 35)**, and the opt-out was removed for API 36 targets.

- Call `enableEdgeToEdge()` (from `androidx.activity`) in `onCreate`.
- Handle insets so content isn't hidden: in Views, `ViewCompat.setOnApplyWindowInsetsListener(view) { v, insets -> val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars()); v.updatePadding(top = bars.top); insets }`. In Compose, `Scaffold` provides `innerPadding`, or use `Modifier.windowInsetsPadding(WindowInsets.systemBars)` / `safeDrawingPadding()`.
- Handle the **IME** (keyboard) insets too: `WindowInsets.ime`, or `imePadding()`.

</details>

### 24. How do you make an app accessible?

<details>
<summary>Answer</summary>

- `contentDescription` on images and icon buttons (`null` for decorative ones). In Compose, `Modifier.semantics {}`.
- **Touch targets ≥ 48 dp**, sufficient **color contrast** (4.5:1), and text in sp that supports large font scales.
- Logical focus order, labels for inputs, and grouping related elements (`mergeDescendants`).
- Test with **TalkBack**, Switch Access and the Accessibility Scanner. In tests, use Espresso's `AccessibilityChecks`.

</details>

### 25. What are SurfaceView and TextureView?

<details>
<summary>Answer</summary>

Both render content from a **separate thread** (video, camera, games).
- **SurfaceView** – has its own window surface, composited by SurfaceFlinger. **Most efficient** (better battery, lower latency), but historically harder to animate or transform.
- **TextureView** – behaves like a normal View (can be transformed, animated, made translucent), but it's less efficient, adds latency and requires hardware acceleration.

</details>

### 26. What is the difference between Animation APIs in Views?

<details>
<summary>Answer</summary>

- **View animation** (legacy tween) – only changes how the view is drawn, not its actual properties (a moved button is still clickable at the old position).
- **Property animation** (`ValueAnimator`, `ObjectAnimator`, `view.animate()`) – changes real properties.
- **MotionLayout** – complex, declarative, gesture-driven animations.
- **Transitions** framework, shared element transitions, `AnimatedVectorDrawable`, Lottie.
- Physics-based: `SpringAnimation`, `FlingAnimation`.

</details>

### 27. What is a Spannable?

<details>
<summary>Answer</summary>

A Spannable is text with **styling spans** applied to ranges (bold, color, clickable links, images) inside one TextView: `SpannableString` / `buildSpannedString { bold { append("Hi") } }`. In Compose, use `AnnotatedString` / `buildAnnotatedString`.

</details>

### 28. What is a Toast vs Snackbar vs Dialog?

<details>
<summary>Answer</summary>

- **Toast** – a brief system message with no interaction. Limited on Android 11+ (text-only toasts from the background).
- **Snackbar** (Material) – shown at the bottom, can have an **action** (Undo), and can be swiped away. Tied to a view, or to `SnackbarHost` in Compose.
- **Dialog** – modal; requires a user decision.

</details>

---

[⬅ Previous: Activity & Fragment](09-activity-fragment.md) · [⬅ Back to index](../README.md) · [Next: Jetpack Compose ➡](11-jetpack-compose.md)
