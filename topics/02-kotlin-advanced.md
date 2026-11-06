# Kotlin – Advanced

[⬅ Back to index](../README.md)

Covers: scope functions, inline/reified, generics & variance, delegation, annotations & Java interop, DSLs, Kotlin 2.x / K2.

---

## Scope Functions

### 1. What are scope functions? Explain `let`, `run`, `with`, `apply`, `also`.

<details>
<summary>Answer</summary>

Scope functions run a block of code in the context of an object. They differ in **how the object is referenced** (`this` or `it`) and **what they return**.

| Function | Object ref | Returns | Typical use |
|---|---|---|---|
| `let` | `it` | lambda result | null checks (`x?.let {}`), transforming a value |
| `run` | `this` | lambda result | configure and compute a result |
| `with(obj)` | `this` | lambda result | call many methods on a non-null object |
| `apply` | `this` | **the object** | object configuration / builder style |
| `also` | `it` | **the object** | side effects: logging, validation |

```kotlin
val length = name?.let { it.length } ?: 0
val intent = Intent(ctx, A::class.java).apply { putExtra("id", 1) }
val user = createUser().also { log("created $it") }
val text = with(person) { "Name: $name, Age: $age" }
val ok = service.run { connect(); isConnected }
```

Memory trick: **apply/also return the object** ("A" for "and give it back"), while **let/run/with return the lambda result**.

</details>

### 2. What are `takeIf` and `takeUnless`?

<details>
<summary>Answer</summary>

`takeIf` returns the object if the predicate is true, otherwise `null`. `takeUnless` is the opposite.

```kotlin
val validEmail = email.takeIf { it.contains("@") } ?: return
```

</details>

---

## Inline, noinline, crossinline, reified

### 3. What is an inline function and why use it?

<details>
<summary>Answer</summary>

`inline` tells the compiler to **copy the function body (and its lambda arguments) into the call site**. For higher-order functions this removes:
- the allocation of a function object for each lambda, and
- the virtual `invoke()` call.

```kotlin
inline fun <T> measure(block: () -> T): T {
    val start = System.nanoTime()
    return block().also { println(System.nanoTime() - start) }
}
```

Benefits: performance for lambdas, **non-local returns** (`return` inside the lambda returns from the outer function), and `reified` type parameters.
Drawbacks: **bigger bytecode** if the function body is large and called from many places. Don't inline functions without lambda parameters (the IDE warns you).

</details>

### 4. What are `noinline` and `crossinline`?

<details>
<summary>Answer</summary>

- **`noinline`** – stops a specific lambda parameter from being inlined, so you can store it or pass it to a non-inline function.
- **`crossinline`** – the lambda is still inlined, but **non-local returns are forbidden**. You need it when the lambda is called from another execution context, such as a nested lambda or a `Runnable`.

```kotlin
inline fun runOnUi(crossinline block: () -> Unit) {
    handler.post { block() }  // called inside another lambda → needs crossinline
}
```

</details>

### 5. What is `reified` and why does it only work with inline functions?

<details>
<summary>Answer</summary>

On the JVM, generics are **erased** at runtime, so `T::class` isn't available. With `inline` + `reified`, the compiler substitutes the actual type at each call site, so the type is known:

```kotlin
inline fun <reified T : Activity> Context.start() =
    startActivity(Intent(this, T::class.java))

context.start<DetailActivity>()
inline fun <reified T> Gson.fromJson(json: String): T = fromJson(json, T::class.java)
```

It only works with inline functions because the body has to be copied for each call site.

</details>

### 6. What are non-local returns?

<details>
<summary>Answer</summary>

Inside the lambda of an **inline** function, a bare `return` exits the **enclosing function**, not just the lambda:

```kotlin
fun findFirstAdult(users: List<User>): User? {
    users.forEach { if (it.age >= 18) return it }  // returns from findFirstAdult
    return null
}
```

To return only from the lambda, use a label: `return@forEach`.

</details>

---

## Generics & Variance

### 7. What are generics? What is type erasure?

<details>
<summary>Answer</summary>

Generics let you write type-safe code that works with many types (`List<T>`, `Result<T>`). On the JVM, type arguments are **erased at runtime**: `List<String>` and `List<Int>` are both just `List`. That's why `if (x is List<String>)` doesn't compile (use `is List<*>`), and why `reified` exists.

</details>

### 8. Explain variance: `in`, `out`, invariance (covariance/contravariance).

<details>
<summary>Answer</summary>

- **Invariant** (default): `MutableList<String>` is **not** a `MutableList<Any>`.
- **Covariant `out T`** (producer): `T` is only returned, never consumed. `List<out E>`, so `List<String>` **is a** `List<Any>`.
- **Contravariant `in T`** (consumer): `T` is only taken as input. `Comparator<in T>`, so a `Comparator<Any>` can be used where a `Comparator<String>` is needed.

Mnemonic: **PECS**, "Producer Extends, Consumer Super" (Java's `? extends` = `out`, `? super` = `in`).

Declaration-site variance: `interface Source<out T>`. Use-site variance: `fun copy(from: Array<out Any>, to: Array<Any>)`.

</details>

### 9. What is star projection `*`?

<details>
<summary>Answer</summary>

`List<*>` means "a list of some unknown type". You can read elements as `Any?`, but you can't write anything into it, which makes it safe. It's similar to Java's `List<?>`.

</details>

### 10. What are generic constraints?

<details>
<summary>Answer</summary>

Upper bounds restrict the allowed type arguments: `fun <T : Comparable<T>> max(a: T, b: T)`. Multiple bounds use `where`:

```kotlin
fun <T> save(item: T) where T : Serializable, T : Comparable<T> { }
```

</details>

---

## Delegation

### 11. What is class delegation (`by`)?

<details>
<summary>Answer</summary>

Kotlin supports the **Delegation pattern** natively, which favors composition over inheritance:

```kotlin
class LoggingList<T>(private val inner: MutableList<T>) : MutableList<T> by inner {
    override fun add(element: T): Boolean { println("add $element"); return inner.add(element) }
}
```

The compiler generates forwarding methods for every interface member you don't override.

</details>

### 12. What are delegated properties? Examples?

<details>
<summary>Answer</summary>

The getter/setter of a property is handed to another object that implements `getValue`/`setValue`:
- `by lazy { }` – compute once.
- `by Delegates.observable(initial) { prop, old, new -> }` – get notified when the value changes.
- `by Delegates.vetoable` – reject changes.
- `by map` – read properties from a `Map`.
- Android: `by viewModels()`, `by activityViewModels()`, `by navArgs()`, and Compose `var x by remember { mutableStateOf(0) }`.

Custom delegate: implement the `ReadWriteProperty<Any?, T>` interface (for example a SharedPreferences delegate).

</details>

---

## Java Interop & Annotations

### 13. Explain `@JvmStatic`, `@JvmField`, `@JvmOverloads`, `@JvmName`.

<details>
<summary>Answer</summary>

- **`@JvmStatic`** – in an `object`/`companion object`, generates a real **static** method so Java can call `Util.foo()` instead of `Util.Companion.foo()`.
- **`@JvmField`** – exposes a property as a **public field**, without a getter or setter.
- **`@JvmOverloads`** – generates Java overloads for functions or constructors with **default arguments**. Commonly used for custom View constructors.
- **`@JvmName`** – renames the generated JVM method or file class (e.g. to avoid clashing signatures after erasure).
- Also: `@Throws` (declares checked exceptions for Java callers) and `@JvmSuppressWildcards`, which shows up with Dagger and generics.

</details>

### 14. How does Kotlin handle checked exceptions?

<details>
<summary>Answer</summary>

Kotlin has **no checked exceptions**. You aren't forced to catch or declare them. When Java code needs to know about them, add `@Throws(IOException::class)`. Prefer modelling expected failures with `Result<T>` or sealed classes, and keep exceptions for exceptional cases.

</details>

### 15. What is `Result<T>` and `runCatching`?

<details>
<summary>Answer</summary>

`Result` is a standard-library wrapper for success or failure:

```kotlin
val result = runCatching { api.getUser() }
result.onSuccess { show(it) }.onFailure { showError(it) }
val user = result.getOrElse { User.EMPTY }
```

⚠️ `runCatching` also catches `CancellationException`, which breaks coroutine cancellation. Inside coroutines, rethrow `CancellationException` or use a custom wrapper.

</details>

---

## Other Advanced Topics

### 16. What is operator overloading?

<details>
<summary>Answer</summary>

You define `operator fun` with specific names: `plus` (+), `minus`, `times`, `get`/`set` (`[]`), `invoke` (`()`), `contains` (`in`), `compareTo` (`<`, `>`), `rangeTo` (`..`), `componentN`.

```kotlin
data class Point(val x: Int, val y: Int) { operator fun plus(o: Point) = Point(x + o.x, y + o.y) }
```

</details>

### 17. What is a Kotlin DSL? How is it built?

<details>
<summary>Answer</summary>

A DSL is a domain-specific, readable API built from **lambdas with receivers** (`T.() -> Unit`), extension functions, infix functions and `@DslMarker`.

```kotlin
fun html(block: HTML.() -> Unit): HTML = HTML().apply(block)
```

Examples: Gradle Kotlin DSL (`build.gradle.kts`), Compose's API style, Ktor routing, `buildString {}`, `buildList {}`.

</details>

### 18. What is a lambda with receiver?

<details>
<summary>Answer</summary>

A function type like `StringBuilder.() -> Unit`. Inside the lambda, `this` is the receiver, so you can call its members directly. `apply`, `with`, `buildString` and most DSLs are built on it.

</details>

### 19. What is a SAM / functional (`fun`) interface?

<details>
<summary>Answer</summary>

A Single Abstract Method interface. Kotlin lets you pass a lambda where a Java SAM interface is expected (`view.setOnClickListener { }`). For Kotlin interfaces, declare them as `fun interface Validator { fun validate(s: String): Boolean }` to enable SAM conversion.

</details>

### 20. What is the difference between `Any`, `Unit`, `Nothing` and `Any?`?

<details>
<summary>Answer</summary>

- `Any` – the root of all **non-null** types (like `Object`).
- `Any?` – the true top type, including null.
- `Unit` – a single value meaning "no meaningful result".
- `Nothing` – no values; the bottom type (`throw`, `TODO()`). `Nothing?` has one value, `null`.

</details>

### 21. What are tail-recursive functions (`tailrec`)?

<details>
<summary>Answer</summary>

`tailrec fun` lets the compiler turn tail recursion (where the recursive call is the last operation) into a loop. This avoids `StackOverflowError` for deep recursion.

</details>

### 22. What is the K2 compiler and what changed in Kotlin 2.x?

<details>
<summary>Answer</summary>

- **Kotlin 2.0 (2024)** shipped the new **K2 compiler** as stable. It has a unified frontend for all platforms, much faster compilation, and smarter smart casts (for example after `||` checks and inside lambdas).
- The **Compose compiler** moved into the Kotlin repo and is applied with the `org.jetbrains.kotlin.plugin.compose` Gradle plugin, so its version now matches Kotlin.
- Newer 2.x language features include guard conditions in `when` (`is X if cond ->`), non-local `break`/`continue`, multi-dollar string interpolation, and **context parameters** (preview, replacing context receivers).
- **KSP2** replaces kapt for annotation processing (Room, Hilt and Moshi all support KSP).

</details>

### 23. What are context receivers / context parameters?

<details>
<summary>Answer</summary>

They let a function require "context" values implicitly instead of passing them everywhere: `context(logger: Logger) fun process() { logger.log(..) }`. Context receivers were experimental. They're being replaced by **context parameters** (preview in Kotlin 2.2+). Good to mention when asked "what's new in Kotlin", but they're not production-standard yet.

</details>

### 24. What is reflection in Kotlin and why avoid it on Android?

<details>
<summary>Answer</summary>

`::class`, `KClass`, `KProperty` and `kotlin-reflect` let you inspect code at runtime. On Android, avoid full `kotlin-reflect` because it's a large library, it's slow, and it breaks with R8 obfuscation unless you add keep rules. Prefer **code generation** (KSP, kotlinx.serialization, Moshi codegen) over reflection-based libraries.

</details>

### 25. What is `kotlinx.serialization` and how is it different from Gson?

<details>
<summary>Answer</summary>

- `kotlinx.serialization` is **compile-time code generation** (`@Serializable`). It's reflection-free, multiplatform, understands Kotlin default values and nullability, and works well with R8.
- **Gson** is reflection-based and Java-oriented. It can put `null` into non-null Kotlin fields and **ignores default values** (it creates objects without calling the constructor). It's in maintenance mode.
- **Moshi** is Kotlin-aware, with a codegen option.

In new projects, prefer kotlinx.serialization (or Moshi).

</details>


---

## Annotations & Lazy Internals

### 26. What are annotations? How do you create a custom annotation?

<details>
<summary>Answer</summary>

Annotations attach **metadata** to code. That metadata is read by the compiler (e.g. `@Deprecated`), by annotation processors at build time (`@Entity`, `@Inject`), or by reflection at runtime.

```kotlin
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)     // SOURCE | BINARY | RUNTIME
annotation class TrackEvent(val name: String)

class Checkout { @TrackEvent("purchase_clicked") fun buy() { } }
```

- **`@Target`** – where the annotation can be applied (class, function, property, field, parameter…).
- **`@Retention`** – `SOURCE` (discarded by the compiler; used by lint), `BINARY` (kept in the class file but not visible to reflection), `RUNTIME` (readable through reflection).
- Use-site targets: `@field:SerializedName`, `@get:JvmName`, `@param:Inject`.

Android-specific ones: `@IntDef`/`@StringDef` (type-safe constants checked by lint), `@MainThread`, `@WorkerThread`, `@RequiresApi`, `@Keep` (prevents R8 from removing the code).

</details>

### 27. What is annotation processing? How do kapt and KSP generate code?

<details>
<summary>Answer</summary>

An **annotation processor** runs at **compile time**, finds annotated elements, and **generates source code**. Dagger/Hilt generate factories and components, Room generates DAO implementations, and Moshi/Glide generate adapters.

- **kapt** generates Java stubs from the Kotlin code so that Java processors (JSR-269) can run. That makes it slow.
- **KSP** gives processors a Kotlin-aware symbol API directly, so it's faster, multiplatform-friendly and incremental.

Generated code removes the need for **runtime reflection**, which keeps things fast and R8-friendly, and turns mistakes into **compile-time errors** (a missing Dagger binding, invalid SQL in Room).

</details>

### 28. What are the thread-safety modes of `lazy`?

<details>
<summary>Answer</summary>

`by lazy(mode) { }`:
- **`SYNCHRONIZED`** (default) – a lock guarantees the initializer runs **exactly once**, even with multiple threads.
- **`PUBLICATION`** – several threads may run the initializer concurrently, but only the **first returned value** is stored. There's no lock.
- **`NONE`** – no synchronization at all. Fastest, but only safe when the value is accessed from a single thread (e.g. a UI-only property).

Use `NONE` for main-thread-only lazies in Views and Fragments to avoid the cost of locking.

</details>

---

[⬅ Previous: Kotlin Fundamentals](01-kotlin-basics.md) · [⬅ Back to index](../README.md) · [Next: Coroutines ➡](03-coroutines.md)
