# Kotlin – Fundamentals

[⬅ Back to index](../README.md)

Covers: language basics, null safety, classes & objects, collections, functions and lambdas.

---

## Language Basics

### 1. What is Kotlin?

<details>
<summary>Answer</summary>

Kotlin is a modern, statically typed language by JetBrains that runs on the JVM (and also compiles to JS, Native and Wasm via Kotlin Multiplatform). It is 100% interoperable with Java, and Google has made it the **preferred language for Android** (Kotlin-first since 2019). Jetpack Compose, coroutines and most new Jetpack APIs are Kotlin-first.

</details>

### 2. How is Kotlin different from Java?

<details>
<summary>Answer</summary>

| Kotlin | Java |
|---|---|
| Null safety in the type system (`String` vs `String?`) | Any reference can be `null` → NPE |
| Concise: data classes, type inference, default/named args | More boilerplate (getters/setters, overloads) |
| Extension functions, higher-order functions, lambdas built-in | Lambdas since Java 8, no extensions |
| Coroutines for async | Threads / Executors / CompletableFuture |
| No checked exceptions | Checked exceptions |
| `object`, `companion object` instead of `static` | `static` keyword |
| Smart casts, `when` expression, sealed classes | `instanceof` + explicit casts (pattern matching only in new Java) |
| Classes are `final` by default | Classes are open by default |

</details>

### 3. What are the advantages of using Kotlin?

<details>
<summary>Answer</summary>

- **Concise** – less boilerplate (data classes, properties, type inference).
- **Null safety** – most NPEs are caught at compile time.
- **Interoperability** – use any Java library; mix Java & Kotlin in one module.
- **Coroutines** – structured, readable async code.
- **Functional features** – higher-order functions, lambdas, collection operators.
- **Multiplatform** – share business logic across Android, iOS, desktop, web (KMP).
- **Tooling** – first-class support in Android Studio; Compose is Kotlin-only.

</details>

### 4. What are the basic data types in Kotlin?

<details>
<summary>Answer</summary>

- **Numbers:** `Byte`, `Short`, `Int`, `Long`, `Float`, `Double` (+ unsigned `UByte`, `UShort`, `UInt`, `ULong`).
- **Boolean**, **Char**, **String**, **Array**.

Everything is an object at the language level (no primitives in syntax), but the compiler maps them to JVM primitives (`int`, `double`…) when possible. Nullable types like `Int?` are **boxed** (`java.lang.Integer`).

</details>

### 5. What is the difference between `val` and `var`?

<details>
<summary>Answer</summary>

- `val` – read-only reference; can be assigned only once (like Java `final`).
- `var` – mutable; can be reassigned.

Note: `val` makes the *reference* read-only, not the object. `val list = mutableListOf(1)` can still be modified with `list.add(2)`.

</details>

### 6. What is the difference between `val` and `const val`?

<details>
<summary>Answer</summary>

| `val` | `const val` |
|---|---|
| Value assigned at **runtime** | Value must be known at **compile time** |
| Any type | Only primitives and `String` |
| Can be local, member, top-level | Only top-level, inside `object` or `companion object` |
| Accessed via a getter | Value is **inlined** at every usage site (no getter call) |

```kotlin
const val BASE_URL = "https://api.example.com"   // compile-time constant
val startTime = System.currentTimeMillis()        // runtime value
```

</details>

### 7. Explain type inference in Kotlin.

<details>
<summary>Answer</summary>

The compiler figures out a variable's type from its initializer, so you don't have to write it:

```kotlin
val name = "Kotlin"     // inferred as String
val count = 10          // Int
val items = listOf(1,2) // List<Int>
```

Kotlin is still **statically typed**: the type is fixed at compile time. Public API return types are often written explicitly for readability.

</details>

### 8. What is the difference between `==` and `===`?

<details>
<summary>Answer</summary>

- `==` – **structural equality**; calls `equals()` (null-safe).
- `===` – **referential equality**; checks whether both references point to the same object.

```kotlin
val a = String(charArrayOf('h','i'))
val b = "hi"
a == b   // true
a === b  // false
```

</details>

### 9. What is `when` in Kotlin and how is it better than `switch`?

<details>
<summary>Answer</summary>

`when` is an **expression** (it returns a value) that replaces `switch`:
- Can match values, ranges (`in 1..10`), types (`is String`), or arbitrary conditions.
- No fall-through, so no `break` is needed.
- With sealed classes/enums used as an expression, it is **exhaustive**: the compiler errors if a case is missing.

```kotlin
val label = when (state) {
    is UiState.Loading -> "Loading"
    is UiState.Success -> state.data
    is UiState.Error -> state.message
}
```

</details>

### 10. What are string templates?

<details>
<summary>Answer</summary>

Embed expressions inside strings: `"Hello $name, you have ${items.size} items"`. Raw strings use `"""..."""` and support multi-line text and `trimIndent()`. Kotlin 2.x also adds multi-dollar interpolation (`$$"""..."""`) for strings that contain a literal `$`.

</details>

---

## Null Safety

### 11. What are nullable types in Kotlin?

<details>
<summary>Answer</summary>

By default, types are **non-nullable** (`String` can never hold `null`). Adding `?` makes a type nullable (`String?`). The compiler forces you to handle `null` before you use a nullable value, which removes most `NullPointerException`s at compile time.

</details>

### 12. How do you handle nullability in Kotlin?

<details>
<summary>Answer</summary>

- **Safe call `?.`** – `user?.name` returns `null` instead of throwing.
- **Elvis `?:`** – default value: `val n = name ?: "Guest"`; also `?: return` / `?: throw`.
- **Safe cast `as?`** – returns `null` if the cast fails.
- **`let`** – `user?.let { show(it) }` runs only when non-null.
- **Not-null assertion `!!`** – throws an NPE if null; avoid it except where null is truly impossible.
- **Smart casts** after `if (x != null)` checks.

</details>

### 13. What is the Elvis operator?

<details>
<summary>Answer</summary>

`?:` returns the left side if it is non-null, otherwise the right side.

```kotlin
val length = text?.length ?: 0
val user = repository.getUser() ?: return   // early exit
```

</details>

### 14. Explain smart casts.

<details>
<summary>Answer</summary>

After a type or null check, the compiler automatically casts the variable, so you don't need an explicit cast:

```kotlin
fun print(x: Any) {
    if (x is String) println(x.length) // x is smart-cast to String
}
```

Smart casts only work when the compiler can guarantee the value can't change between the check and the use: `val` locals, `val` properties without custom getters in the same module, and so on. They **don't work on `var` class properties**, because another thread could change them. Copy the property to a local `val` first.

</details>

### 15. Can NPE still happen in Kotlin? When?

<details>
<summary>Answer</summary>

Yes:
- Explicit `!!` on a null value, or `throw NullPointerException()`.
- **Java interop**: platform types (`String!`) coming from Java can be null.
- Accessing a `lateinit` property before it is initialized (this throws `UninitializedPropertyAccessException`).
- Leaking `this` from a constructor/`init` block before properties are initialized.

</details>

### 16. What are platform types?

<details>
<summary>Answer</summary>

Types coming from Java code that has no nullability annotations show up as `T!`. Kotlin doesn't know whether they are nullable, so it lets you treat them either way, and the null check is your responsibility. Use `@Nullable`/`@NonNull` annotations in Java, or declare the Kotlin type explicitly (`val s: String? = javaObj.name`), to stay safe.

</details>

---

## Classes & Objects

### 17. What is a data class?

<details>
<summary>Answer</summary>

A class meant to hold data. The compiler generates `equals()`, `hashCode()`, `toString()`, `copy()` and `componentN()` (for destructuring) from the properties in the **primary constructor**.

```kotlin
data class User(val id: Int, val name: String)
val u2 = user.copy(name = "New")      // shallow copy with change
val (id, name) = user                 // destructuring
```

Rules: the primary constructor needs at least one `val`/`var`; a data class can't be `abstract`, `open`, `sealed` or `inner`. Properties declared in the class body are **not** part of `equals`/`hashCode`. `copy()` is **shallow**.

</details>

### 18. What is the difference between `object`, `companion object` and a class?

<details>
<summary>Answer</summary>

- **`object` declaration** – a thread-safe, lazily initialized **singleton**.
- **`companion object`** – an object tied to a class. Its members are accessed through the class name (`MyClass.create()`), similar to Java `static`. Use `@JvmStatic` for real static methods in Java.
- **Object expression** (`object : Listener { }`) – an anonymous class instance, like Java's anonymous inner class.

</details>

### 19. What is a sealed class / sealed interface?

<details>
<summary>Answer</summary>

A **restricted class hierarchy**: all direct subclasses must be declared in the same package and module, so the compiler knows every subtype. This gives you **exhaustive `when`** without an `else` branch.

```kotlin
sealed interface UiState {
    data object Loading : UiState
    data class Success(val items: List<Item>) : UiState
    data class Error(val message: String) : UiState
}
```

**Sealed class vs enum:** each enum constant is a single instance with a fixed shape. Sealed subclasses can have **multiple instances with different state**. Use sealed types for UI state, results and navigation events.

</details>

### 20. What is the difference between an enum class and a sealed class?

<details>
<summary>Answer</summary>

| Enum | Sealed |
|---|---|
| Fixed set of **instances** | Fixed set of **types** |
| All constants share the same properties | Each subclass can carry different data |
| Has `values()`/`entries`, `ordinal`, `name` | No built-in listing |
| Singleton constants | Subclasses can be `object` or regular classes with many instances |

</details>

### 21. Why are Kotlin classes `final` by default? What are `open`, `abstract` and `override`?

<details>
<summary>Answer</summary>

Classes and methods are `final` by default, following *Effective Java*'s "design for inheritance or prohibit it". This prevents the fragile base class problem.
- `open` – allows subclassing or overriding.
- `abstract` – can't be instantiated; abstract members must be implemented. Abstract classes are implicitly open.
- `override` – required when overriding; an overriding member is open unless marked `final override`.

</details>

### 22. What are the visibility modifiers in Kotlin?

<details>
<summary>Answer</summary>

- `public` (default) – visible everywhere.
- `private` – inside the class, or inside the file for top-level declarations.
- `protected` – the class and its subclasses (not available for top-level declarations).
- `internal` – visible inside the same **module** (Gradle module). Great for hiding implementation details in modular apps.

Kotlin has no package-private.

</details>

### 23. What are primary and secondary constructors and `init` blocks?

<details>
<summary>Answer</summary>

```kotlin
class User(val name: String, val age: Int = 18) {   // primary constructor
    init { require(age >= 0) }                       // runs as part of the primary constructor
    constructor(name: String, dob: LocalDate) :      // secondary constructor must delegate
        this(name, Period.between(dob, LocalDate.now()).years)
}
```

Initialization order: primary constructor params → property initializers and `init` blocks **in the order they appear** → secondary constructor body.

</details>

### 24. What is the difference between a nested class and an inner class?

<details>
<summary>Answer</summary>

- **Nested** (default) – like a Java `static` nested class; it holds **no reference** to the outer instance.
- **`inner`** – holds a reference to the outer instance (`this@Outer`). It can cause **memory leaks** on Android if it outlives an Activity (for example an inner `Handler` or `AsyncTask`).

</details>

### 25. What are `lateinit` and `by lazy`? What's the difference?

<details>
<summary>Answer</summary>

| `lateinit var` | `val x by lazy { }` |
|---|---|
| `var` only | `val` only |
| Non-null, non-primitive types | Any type |
| You assign it later (e.g. in `onCreate`, DI injection) | Computed on **first access**, then cached |
| Throws `UninitializedPropertyAccessException` if read early | Thread-safe by default (`SYNCHRONIZED`) |
| Check with `::x.isInitialized` | — |

Use `lateinit` for dependency injection and test setup. Use `lazy` for expensive one-time initialization.

</details>

### 26. What are getters/setters and backing fields?

<details>
<summary>Answer</summary>

Kotlin properties have generated accessors. Inside a custom accessor, `field` refers to the **backing field**:

```kotlin
var name: String = ""
    set(value) { field = value.trim() }
val isAdult: Boolean get() = age >= 18   // no backing field (computed)
```

A **backing property** pattern exposes a read-only view: `private val _state = MutableStateFlow(..)` + `val state = _state.asStateFlow()`.

</details>

### 27. What is a value (inline) class?

<details>
<summary>Answer</summary>

`@JvmInline value class UserId(val value: String)` wraps exactly one value. It gives you **type safety** (you can't pass an `Email` where a `UserId` is expected), and the wrapper is **erased at runtime** in most cases, so there's no allocation overhead. It gets boxed when used as a nullable type, a generic or an interface.

</details>

### 28. What is destructuring?

<details>
<summary>Answer</summary>

Unpacking an object into variables using `componentN()` functions (generated for data classes, `Pair`, `Triple` and map entries):

```kotlin
val (id, name) = user
for ((key, value) in map) { }
val (_, second) = pair   // skip with _
```

</details>

---

## Collections

### 29. What are Kotlin collections? Mutable vs immutable?

<details>
<summary>Answer</summary>

Kotlin has `List`, `Set` and `Map`, each in two interfaces:
- **Read-only:** `List<T>` (`listOf`), `Set<T>` (`setOf`), `Map<K,V>` (`mapOf`). No mutation methods.
- **Mutable:** `MutableList` (`mutableListOf`, `arrayListOf`), `MutableSet`, `MutableMap`.

"Read-only" ≠ truly immutable: the same underlying object may be mutable through another reference. For real immutability use `kotlinx.collections.immutable` (useful for Compose stability).

</details>

### 30. What is the difference between a List and an Array?

<details>
<summary>Answer</summary>

- **Array** – fixed size, mutable elements, maps to a Java array. `IntArray` etc. avoid boxing.
- **List** – an interface. `listOf` is read-only, `MutableList` can grow or shrink. Better API, and the preferred choice in most code.
- Both are homogeneous with respect to their generic type (`Array<Any>` / `List<Any>` can hold mixed types).

</details>

### 31. How do you create an empty list?

<details>
<summary>Answer</summary>

`emptyList<String>()`, `listOf<String>()`, or `mutableListOf<String>()` / `ArrayList<String>()` for a mutable one. `emptyList()` returns a shared singleton, so it's cheap.

</details>

### 32. What is the difference between `Sequence` and `Iterable` (collection) operations?

<details>
<summary>Answer</summary>

- **Collection ops** (`list.map{}.filter{}`) are **eager**: each step creates a whole new intermediate list.
- **Sequence ops** (`list.asSequence().map{}.filter{}.toList()`) are **lazy**: elements go through the whole chain one at a time, with no intermediate collections, and short-circuiting operations like `first()` can stop early.

Use sequences for large collections or long chains. Use plain collections for small data, where they're often faster.

</details>

### 33. Name commonly used collection functions.

<details>
<summary>Answer</summary>

`map`, `filter`, `forEach`, `flatMap`, `flatten`, `reduce`, `fold`, `groupBy`, `associateBy`, `partition`, `zip`, `chunked`, `windowed`, `distinctBy`, `sortedBy`, `any`/`all`/`none`, `first`/`firstOrNull`, `sumOf`, `take`/`drop`, `mapNotNull`, `filterIsInstance`.

`reduce` vs `fold`: `fold` takes an initial value (and is safe on empty collections), while `reduce` uses the first element and throws on an empty collection.

</details>

---

## Functions & Lambdas

### 34. What is a lambda expression?

<details>
<summary>Answer</summary>

An anonymous function literal that can be stored in a variable or passed as an argument:

```kotlin
val sum: (Int, Int) -> Int = { a, b -> a + b }
list.filter { it > 10 }   // single parameter is `it`; trailing-lambda syntax
```

The last expression is the return value. A plain `return` inside a lambda returns from the enclosing function (and is only allowed when the lambda is inline). Use a labeled `return@filter` to return from the lambda itself.

</details>

### 35. What are higher-order functions?

<details>
<summary>Answer</summary>

Functions that **take functions as parameters or return functions**. Examples: `map`, `filter`, `let`, `apply`, `setOnClickListener {}`.

```kotlin
fun <T> retry(times: Int, block: () -> T): T { ... }
```

Each lambda passed to a non-inline higher-order function allocates a function object (if it captures variables). That's why `inline` exists.

</details>

### 36. What are default and named arguments?

<details>
<summary>Answer</summary>

```kotlin
fun connect(host: String, port: Int = 443, secure: Boolean = true)
connect("api.com", secure = false)
```

They remove the need for overloads and builders. For Java callers, add `@JvmOverloads` to generate the overloads.

</details>

### 37. What are extension functions? How do they work internally?

<details>
<summary>Answer</summary>

They let you add functions to an existing class without inheriting from it or modifying it:

```kotlin
fun String.countVowels(): Int = count { it in "aeiouAEIOU" }
"Hello, Kotlin!".countVowels()  // 4
```

**Internally** an extension compiles to a **static function** that takes the receiver as its first parameter (`StringExtKt.countVowels(String)`). As a result:
- It is **resolved statically**, based on the declared type, not the runtime type (no polymorphism).
- It can't access `private`/`protected` members.
- If a member function has the same signature, **the member always wins**.

Extension properties are also possible (`val String.lastChar get() = this[length-1]`), but they can't have a backing field.

</details>

### 38. What is an infix function?

<details>
<summary>Answer</summary>

A function called without a dot or parentheses: `a combineWith b`. Rules: it must be a member or extension function, take **exactly one** parameter, and that parameter can't be `vararg` or have a default value.

```kotlin
infix fun String.combineWith(other: String) = "$this $other"
val r = "Hello" combineWith "World"   // "Hello World"
```

Standard library examples: `to` (`1 to "one"`), `until`, `downTo`, `step`, `and`, `or`, `shl`.

</details>

### 39. What is a single-expression function and the `Unit` / `Nothing` types?

<details>
<summary>Answer</summary>

- Single-expression: `fun square(x: Int) = x * x`.
- **`Unit`** – like `void`, but it's a real object (a singleton). Functions without an explicit return type return `Unit`.
- **`Nothing`** – a type with **no values**. It marks code that never completes normally (`throw`, `TODO()`, an infinite loop). It's a subtype of every type, which is why `val x = y ?: throw Exception()` compiles.

</details>

### 40. What is `typealias`?

<details>
<summary>Answer</summary>

A typealias gives an existing type an alternative name, with no new type and no runtime cost: `typealias OnItemClick = (Item) -> Unit`. It improves readability of long function and generic types. If you need real type safety, use a value class.

</details>

---

[⬅ Back to index](../README.md) · [Next: Kotlin Advanced ➡](02-kotlin-advanced.md)
