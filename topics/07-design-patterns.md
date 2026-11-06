# Design Patterns

[⬅ Back to index](../README.md)

Covers: pattern categories, creational/structural/behavioral patterns, each with where it's used in Android.

---

## Overview

### 1. What are software design patterns?

<details>
<summary>Answer</summary>

Design patterns are **general, reusable solutions to common problems** in software design. They aren't finished code. They're proven templates that make code more readable, reusable and maintainable, and they give developers a **shared vocabulary** ("let's use an Observer here").

</details>

### 2. What are the main categories of design patterns?

<details>
<summary>Answer</summary>

- **Creational** – *how objects are created*: Singleton, Factory Method, Abstract Factory, Builder, Prototype.
- **Structural** – *how objects are composed*: Adapter, Facade, Decorator, Proxy, Composite, Bridge, Flyweight.
- **Behavioral** – *how objects communicate and share responsibilities*: Observer, Strategy, Command, State, Chain of Responsibility, Iterator, Mediator, Memento, Template Method, Visitor.

</details>

### 3. Importance, when to use, pros & cons of Creational patterns?

<details>
<summary>Answer</summary>

**Why they matter:** they decouple client code from the concrete classes it instantiates. As systems rely more on composition than inheritance, creating objects with the right configuration becomes more than just calling `new`.

**When to use:**
- Object creation is complex (many steps or parameters) → **Builder**.
- Exactly one instance is needed → **Singleton**.
- The caller shouldn't know the concrete type → **Factory**.
- Cloning is cheaper than building from scratch → **Prototype**.

**Advantages:** flexibility to add new types without changing clients, centralized control over instantiation, reuse, lower coupling.
**Disadvantages:** more classes and interfaces, extra indirection and complexity, and a risk of over-engineering simple code.

</details>

### 4. Importance, when to use, pros & cons of Structural patterns?

<details>
<summary>Answer</summary>

**Why they matter:** they compose classes and objects into larger structures, and make independently developed libraries work together. Object composition can be changed at runtime, which static inheritance can't do.

**When to use:**
- Make incompatible interfaces work together → **Adapter**.
- Simplify a complex subsystem → **Facade**.
- Add behaviour without subclassing → **Decorator**.
- Control access, or create lazily → **Proxy**.
- Tree structures → **Composite**.

**Advantages:** flexibility, reuse, easier integration of third-party or legacy code, better modularity.
**Disadvantages:** extra layers of abstraction, harder to follow, and a pattern used in the wrong context adds complexity.

</details>

### 5. Importance, when to use, pros & cons of Behavioral patterns?

<details>
<summary>Answer</summary>

**Why they matter:** they describe how objects interact and share responsibilities. Complex control flow becomes clear object relationships.

**When to use:**
- Notify many dependents → **Observer**.
- Swap algorithms at runtime → **Strategy**.
- Behaviour depends on internal state → **State**.
- Queue, log or undo actions → **Command**.
- Pass a request along handlers → **Chain of Responsibility**.

**Advantages:** loose coupling, separation of concerns, behaviour encapsulated in its own objects, easier maintenance.
**Disadvantages:** over-engineering, harder-to-follow indirect flow, and performance concerns (e.g. very many observers).

</details>

---

## Creational Patterns

### 6. What is the Singleton pattern? How is it used in Android? What are its problems?

<details>
<summary>Answer</summary>

Singleton ensures a class has **only one instance** with a global access point. Typical uses: logging, configuration, database or network clients.

**Android uses:** the Retrofit/OkHttp client, the Room database instance, the `Application` class, analytics managers. In Kotlin:

```kotlin
object Analytics { fun log(e: String) { } }      // thread-safe, lazy
```

**Problems:** it's global mutable state, hides dependencies, is **hard to test** (you can't swap it out), and **holding a Context causes leaks** (only ever store the `applicationContext`).
**Modern approach:** let DI manage the scope (`@Singleton` in Hilt) instead of hand-written singletons.

</details>

### 7. How does the Factory Method pattern work? Factory vs Abstract Factory?

<details>
<summary>Answer</summary>

**Factory Method** defines an interface for creating an object but lets subclasses or a method decide **which concrete class** to create. Clients depend on the abstraction, not on constructors.

```kotlin
fun createViewHolder(type: Int): BaseViewHolder = when (type) {
    TYPE_HEADER -> HeaderViewHolder()
    else -> ItemViewHolder()
}
```

**Abstract Factory** creates **families of related objects** (e.g. a `ThemeFactory` that creates matching Buttons and Dialogs for Light and Dark themes).

**Android examples:** `ViewModelProvider.Factory`, `Fragment.instantiate`/`FragmentFactory`, `Intent.createChooser`, `BitmapFactory`, Retrofit's `CallAdapter.Factory` and `Converter.Factory`.

</details>

### 8. How does the Builder pattern help in Android development?

<details>
<summary>Answer</summary>

Builder **separates the construction of a complex object from its representation**, so you build it step by step with optional parameters and readable code.

**Android examples:** `AlertDialog.Builder`, `NotificationCompat.Builder`, `Retrofit.Builder`, `OkHttpClient.Builder`, `Room.databaseBuilder`, `WorkRequest.Builder`, `Uri.Builder`.

In Kotlin, **named and default arguments** plus `apply {}` often replace hand-written builders.

</details>

### 9. Prototype vs Builder?

<details>
<summary>Answer</summary>

- **Prototype** – create new objects by **copying an existing one**. Useful when building from scratch is expensive. In Kotlin, `data class copy()`; in Android, `Intent(intent)` and `Bundle.deepCopy()`.
- **Builder** – construct a complex object **step by step**, possibly with different representations from the same process.

</details>

---

## Structural Patterns

### 10. How does the Adapter pattern work in Android?

<details>
<summary>Answer</summary>

Adapter **converts one interface into another that clients expect**, bridging incompatible interfaces without modifying their source.

**Android:**
- `RecyclerView.Adapter` adapts a data list into `ViewHolder`s for the RecyclerView.
- `ArrayAdapter` for ListView/Spinner.
- Retrofit `CallAdapter` (turns `Call<T>` into `suspend`/`Flow`/`Observable`).
- Mapping API DTOs to domain models.

</details>

### 11. What is the Facade pattern? Adapter vs Facade?

<details>
<summary>Answer</summary>

**Facade** gives a **simplified, unified interface to a complex subsystem**.

Android example: a **Repository** is a facade over API, DB and cache. The ViewModel calls `repo.getUser()` without knowing about Retrofit, Room or the caching logic. Libraries like Glide/Coil are facades too (`load(url).into(view)` hides downloading, decoding and caching).

**Adapter vs Facade:** Adapter makes **one** existing interface **compatible** with another. Facade **simplifies** a **set** of interfaces. Adapter is about conversion; Facade is about simplification.

</details>

### 12. How does the Decorator pattern work in Android?

<details>
<summary>Answer</summary>

Decorator **adds behaviour to an object dynamically** by wrapping it in an object with the same interface. It's a flexible alternative to subclassing.

**Android/Java examples:**
- `ContextWrapper` / `ContextThemeWrapper` (wraps a base Context).
- Java I/O: `BufferedInputStream(FileInputStream(..))`.
- OkHttp **Interceptors** decorate requests (adding headers, logging).
- `InputFilter` on EditText.
- Compose `Modifier` chains (`Modifier.padding().background().clickable()`).

</details>

### 13. Explain the Proxy pattern with an Android example.

<details>
<summary>Answer</summary>

Proxy provides a **surrogate that controls access** to another object, for lazy creation, access control, caching or a remote call.

**Android:**
- **Binder/AIDL** – the client calls a local proxy that marshals calls to a service in another process.
- **Retrofit** creates a dynamic `Proxy` implementation of your API interface.
- `ContentProvider` controls access to underlying data.
- Hilt/Dagger `Lazy<T>` / `Provider<T>`.

</details>

### 14. What is the Composite pattern?

<details>
<summary>Answer</summary>

Composite treats **individual objects and groups of objects uniformly** in a tree structure. Android's **View hierarchy** is the classic example: `ViewGroup` is a `View` that contains other `View`s, and `measure`/`layout`/`draw` recurse through the tree. Compose's UI tree works the same way.

</details>

### 15. What is the Flyweight pattern and how can it be used in Android?

<details>
<summary>Answer</summary>

Flyweight **minimizes memory by sharing common (intrinsic) state** between many similar objects, while keeping per-object (extrinsic) state outside.

**Android:** **RecyclerView view recycling** (a few ViewHolders display thousands of items), the String pool, `RecycledViewPool` shared between nested RecyclerViews, `Message.obtain()` pooling, and sharing bitmaps or textures in games.

</details>

### 16. What is the Bridge pattern?

<details>
<summary>Answer</summary>

Bridge **separates an abstraction from its implementation** so the two can vary independently. Example: a `Notifier` abstraction (Urgent / Normal) combined with a `Channel` implementation (Push / Email / SMS). You avoid creating a class for every combination.

</details>

---

## Behavioral Patterns

### 17. What is the Observer pattern and how is it used in Android?

<details>
<summary>Answer</summary>

Observer defines a **one-to-many dependency**: when the subject changes state, all its observers are notified automatically. Example: when a news article is published, all subscribed users are notified.

**Android:** `LiveData` observers, `StateFlow`/`Flow` collectors, RxJava `Observable`, click listeners, `BroadcastReceiver`, `LifecycleObserver`, Compose's snapshot state (recomposition when state changes). It's the foundation of **reactive UI** in MVVM.

</details>

### 18. What is the Strategy pattern?

<details>
<summary>Answer</summary>

Strategy defines a **family of interchangeable algorithms**, encapsulates each one, and lets the client choose at runtime.

```kotlin
interface SortStrategy { fun sort(items: List<Item>): List<Item> }
class ByPrice : SortStrategy { ... }
class ByRating : SortStrategy { ... }
```

**Android:** `Interpolator`s for animations, RecyclerView `LayoutManager`s (Linear/Grid/Staggered), Retrofit converters, `Comparator`s, different payment or auth strategies. In Kotlin, a simple strategy can just be a lambda.

</details>

### 19. What is the Command pattern, and where is it used in Android?

<details>
<summary>Answer</summary>

Command **encapsulates a request as an object**, so you can parameterize, queue, log and **undo/redo** it.

**Android:** `Runnable`s posted to a `Handler`, `WorkManager` work requests (queued and retried), MVI **intents/actions** (`UserAction.Refresh`), and undo/redo in an editor app where each edit is a command object.

</details>

### 20. What is the Chain of Responsibility pattern and how is it used in Android?

<details>
<summary>Answer</summary>

A request passes **along a chain of handlers**, and each one either handles it or passes it on.

**Android:**
- **Touch event dispatch**: `Activity` → `ViewGroup.dispatchTouchEvent` → `onInterceptTouchEvent` → child `View.onTouchEvent`. If nobody consumes the event, it bubbles back up.
- **OkHttp interceptor chain** (`chain.proceed(request)`).
- `OnBackPressedDispatcher` callbacks.

</details>

### 21. What is the State pattern?

<details>
<summary>Answer</summary>

An object **changes its behaviour when its internal state changes**, as if it changed its class. Each state is its own class. Android: a media player (Idle/Playing/Paused), or a UI driven by a sealed `UiState` (`Loading`/`Success`/`Error`) in MVI.

</details>

### 22. What is the Template Method pattern?

<details>
<summary>Answer</summary>

A base class defines the **skeleton of an algorithm**, and subclasses override specific steps. Android lifecycle callbacks are a form of it: the framework controls the flow and you override `onCreate`, `onStart`… Also `AsyncTask` (`onPreExecute` → `doInBackground` → `onPostExecute`) and `RecyclerView.Adapter`'s `onCreateViewHolder`/`onBindViewHolder`.

</details>

### 23. What is the Mediator pattern?

<details>
<summary>Answer</summary>

Mediator **centralizes communication** between objects so they don't refer to each other directly. Android: an Activity or a **shared ViewModel** coordinating between Fragments, instead of Fragments talking to each other directly.

</details>

### 24. What is the Iterator and Memento pattern?

<details>
<summary>Answer</summary>

- **Iterator** – access the elements of a collection sequentially without exposing how it's stored (`Iterator`, Kotlin `Sequence`, `Cursor` in Android).
- **Memento** – capture and restore an object's state without breaking encapsulation. Android: `onSaveInstanceState` / `Bundle`, `SavedStateHandle`, and `View.onSaveInstanceState()` returning a `Parcelable`.

</details>

### 25. Which design patterns have you used in your Android project? (How to answer)

<details>
<summary>Answer</summary>

Pick 3–4 and give concrete examples:
- **Repository / Facade** – a single access point for API + DB.
- **Observer** – StateFlow/LiveData from ViewModel to UI.
- **Builder** – Retrofit, OkHttp, notifications.
- **Singleton (through DI)** – database and network clients scoped `@Singleton` in Hilt.
- **Adapter** – RecyclerView adapters, DTO → domain mappers.
- **Strategy** – pluggable payment or analytics providers.
- **Dependency Injection** – Hilt modules.

Explain **why** you chose each one (testability, decoupling), not just what it is.

</details>

---

[⬅ Previous: OOP & SOLID](06-oop-solid.md) · [⬅ Back to index](../README.md) · [Next: Android Fundamentals ➡](08-android-fundamentals.md)
