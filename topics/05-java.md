# Java for Android Developers

[⬅ Back to index](../README.md)

Covers: core Java, OOP in Java, Strings, collections internals, JVM memory, multithreading, exceptions. These questions still come up often, especially for Java-heavy codebases.

---

## Core Java

### 1. Is Java pass-by-value or pass-by-reference?

<details>
<summary>Answer</summary>

**Always pass-by-value.** For objects, the *value of the reference* is copied. So you can modify the object's fields through the parameter, but reassigning the parameter doesn't affect the caller's variable.

</details>

### 2. Why is `String` immutable? What is the String pool?

<details>
<summary>Answer</summary>

- **String pool:** literals are stored in a pool on the heap and shared (`"a" == "a"` refer to the same object). `new String("a")` creates a separate object; `intern()` returns the pooled copy.
- **Why immutable:** pooling is only safe if strings can't change; strings are **thread-safe**; the **hashCode is cached** (great for HashMap keys); and it's more **secure** (file paths, URLs and class names can't be altered after validation).

</details>

### 3. `String` vs `StringBuilder` vs `StringBuffer`?

<details>
<summary>Answer</summary>

- `String` – immutable. Concatenating in a loop creates many objects.
- `StringBuilder` – mutable, **not synchronized**, fast. Use it in single-threaded code.
- `StringBuffer` – mutable, **synchronized** (thread-safe), slower. Rarely needed.

</details>

### 4. `==` vs `equals()`? What is the `equals`/`hashCode` contract?

<details>
<summary>Answer</summary>

- `==` compares references (or primitive values). `equals()` compares logical equality.
- **Contract:** if `a.equals(b)` then `a.hashCode() == b.hashCode()`. The reverse isn't required (collisions are allowed).
- If you override `equals` without `hashCode`, `HashMap`/`HashSet` break: equal objects land in different buckets, so `contains()` fails.

</details>

### 5. `final`, `finally`, `finalize`?

<details>
<summary>Answer</summary>

- `final` – a variable can't be reassigned, a method can't be overridden, a class can't be extended.
- `finally` – a block that always runs after try/catch (except on `System.exit` or a JVM crash).
- `finalize()` – a GC callback before an object is collected. **Deprecated**: unpredictable, so don't use it. Use `try-with-resources` or `Cleaner` instead.

</details>

### 6. What is `static`? Static vs instance?

<details>
<summary>Answer</summary>

`static` members belong to the **class**, not to instances. There's one copy, shared across instances. Static methods can't access instance members or `this`. On Android, **static references to Views, Activities or Contexts are a classic memory leak**, because statics live as long as the class loader (the whole process).

</details>

### 7. Abstract class vs interface?

<details>
<summary>Answer</summary>

| Abstract class | Interface |
|---|---|
| Can have state (fields) and constructors | No instance state (only constants) |
| Single inheritance | A class can implement many |
| Any access modifiers | Methods are public (Java 9+ allows private helpers) |
| "is-a" with shared code | "can-do" capability / contract |

Since Java 8, interfaces can have `default` and `static` methods.

</details>

### 8. Overloading vs overriding?

<details>
<summary>Answer</summary>

- **Overloading** – same name, different parameters, in the same class. Resolved at **compile time** (static polymorphism).
- **Overriding** – a subclass redefines a method with the same signature. Resolved at **runtime** (dynamic dispatch). Return types can be covariant.

</details>

### 9. What are checked vs unchecked exceptions?

<details>
<summary>Answer</summary>

- **Checked** (`IOException`, `SQLException`) – subclasses of `Exception` (but not `RuntimeException`). They must be caught or declared with `throws`.
- **Unchecked** (`NullPointerException`, `IllegalArgumentException`, `IndexOutOfBoundsException`) – subclasses of `RuntimeException`. Not enforced by the compiler.
- **`Error`** (`OutOfMemoryError`, `StackOverflowError`) – serious problems; don't catch them.
- Hierarchy: `Throwable` → `Exception` / `Error`.

</details>

### 10. What is try-with-resources?

<details>
<summary>Answer</summary>

`try (InputStream in = ...) { }` automatically closes resources that implement `AutoCloseable`, even when an exception is thrown. Kotlin's equivalent is `use {}`.

</details>

### 11. What are generics wildcards `? extends` and `? super`?

<details>
<summary>Answer</summary>

- `List<? extends Number>` – read-only producer: you can read `Number`s, but you can't add.
- `List<? super Integer>` – consumer: you can add `Integer`s, but reads give you `Object`.
- PECS: **Producer Extends, Consumer Super**. Kotlin's equivalents are `out` and `in`.

</details>

---

## Collections

### 12. How does `HashMap` work internally?

<details>
<summary>Answer</summary>

1. It's backed by an **array of buckets** (default capacity 16, load factor 0.75).
2. `put(k, v)`: compute `hash(k.hashCode())` → bucket index = `hash & (n-1)`.
3. If the bucket is empty, store a node. If there's a collision, chain nodes in a **linked list**. In Java 8+, a bucket with more than 8 entries (when the table has ≥ 64 buckets) becomes a **red-black tree**, so the worst case improves from O(n) to O(log n).
4. Keys are found with `hashCode` and then `equals`.
5. When `size > capacity × loadFactor`, it **resizes** (doubles) and rehashes.

Average get/put is O(1). It allows one `null` key, is **not thread-safe**, and doesn't preserve order.

</details>

### 13. `HashMap` vs `LinkedHashMap` vs `TreeMap` vs `ConcurrentHashMap` vs `Hashtable`?

<details>
<summary>Answer</summary>

- **HashMap** – unordered, O(1), not synchronized.
- **LinkedHashMap** – keeps insertion order (or access order → used to build an **LRU cache**).
- **TreeMap** – sorted by key (red-black tree), O(log n).
- **ConcurrentHashMap** – thread-safe with fine-grained locking/CAS; no null keys or values.
- **Hashtable** – legacy; fully synchronized, slow.

On Android, also consider **`ArrayMap`** and **`SparseArray`** (memory-efficient for small maps and int keys).

</details>

### 14. `ArrayList` vs `LinkedList`?

<details>
<summary>Answer</summary>

- `ArrayList` – a dynamic array. O(1) random access; inserting or removing in the middle is O(n). Cache-friendly, so it's the usual choice.
- `LinkedList` – a doubly-linked list. O(1) insert/remove at the ends or at an iterator position; O(n) access. Higher memory per element.

</details>

### 15. What is `ConcurrentModificationException`?

<details>
<summary>Answer</summary>

It's thrown when a collection is structurally modified while you iterate over it with a fail-fast iterator (e.g. calling `list.remove()` inside a for-each loop). Fix: use `iterator.remove()`, `removeIf`, iterate over a copy, or use a concurrent collection such as `CopyOnWriteArrayList`.

</details>

### 16. `Comparable` vs `Comparator`?

<details>
<summary>Answer</summary>

`Comparable.compareTo()` defines the **natural ordering** inside the class itself. `Comparator.compare()` defines an **external, custom ordering**, and you can have many (`compareBy { it.age }.thenBy { it.name }` in Kotlin).

</details>

---

## JVM & Memory

### 17. Explain JVM memory areas: stack vs heap.

<details>
<summary>Answer</summary>

- **Stack** (one per thread) – method frames, local primitives and references. LIFO; freed automatically when a method returns. Too-deep recursion causes `StackOverflowError`.
- **Heap** (shared) – all objects and arrays. Managed by the GC. Running out causes `OutOfMemoryError`.
- Others: the metaspace/method area (class metadata, statics), the PC register, and native stacks.

</details>

### 18. What are strong, soft, weak and phantom references?

<details>
<summary>Answer</summary>

- **Strong** – a normal reference; never collected while it's reachable.
- **Soft** – collected only when memory is low (used for caches, though on Android `LruCache` is preferred).
- **Weak** – collected at the next GC if only weak references remain. Used to avoid leaks, e.g. `WeakReference<Activity>` inside a Handler.
- **Phantom** – used for post-mortem cleanup tracking (`ReferenceQueue`).

</details>

### 19. How does garbage collection decide an object is garbage?

<details>
<summary>Answer</summary>

By **reachability**. Starting from **GC roots** (active thread stacks, static fields, JNI references, the main thread's Looper…), it marks every object it can reach. Unreachable objects are collected, even if they reference each other in a cycle, so circular references are fine.

</details>

---

## Multithreading

### 20. What is the difference between a process and a thread?

<details>
<summary>Answer</summary>

A **process** has its own memory space (each Android app normally runs in its own Linux process). **Threads** run inside a process and **share** its memory (heap). That makes threads cheaper, but they need synchronization.

</details>

### 21. How do you create a thread in Java?

<details>
<summary>Answer</summary>

Extend `Thread`, implement `Runnable` / `Callable`, or (preferred) submit tasks to an **`ExecutorService`** (thread pool): `Executors.newFixedThreadPool(4).submit(task)`. `Callable` returns a result through a `Future`.

</details>

### 22. What is `synchronized`? What is `volatile`?

<details>
<summary>Answer</summary>

- **`synchronized`** – mutual exclusion: only one thread at a time can run the block or method on the same monitor (lock object). It also gives **visibility** (a happens-before relationship).
- **`volatile`** – guarantees **visibility**: writes go straight to main memory, so every thread sees the latest value, and it prevents reordering. It does **not** make compound operations atomic: `count++` on a volatile field is still a race.
- For atomic counters, use `AtomicInteger` (CAS-based). Kotlin uses `@Volatile` and `@Synchronized`.

</details>

### 23. What is a deadlock? How do you avoid it?

<details>
<summary>Answer</summary>

A deadlock happens when two or more threads each hold a lock and wait for a lock the other holds, so they wait forever. Avoid it by **always acquiring locks in the same order**, using timeouts (`tryLock`), holding locks for as short a time as possible, or avoiding nested locks. Related problems: **livelock** (threads keep reacting to each other without making progress) and **starvation**.

</details>

### 24. What is a race condition?

<details>
<summary>Answer</summary>

The result depends on the timing of threads accessing shared mutable state (e.g. two threads doing `count++`). Fix it with synchronization, atomics, immutability, or by confining the state to a single thread.

</details>

### 25. Write a thread-safe singleton (double-checked locking).

<details>
<summary>Answer</summary>

```java
public class Db {
    private static volatile Db instance;
    private Db() {}
    public static Db get() {
        if (instance == null) {
            synchronized (Db.class) {
                if (instance == null) instance = new Db();
            }
        }
        return instance;
    }
}
```

`volatile` is required to prevent other threads seeing a partially constructed object. In Kotlin, just use `object Db`, or `by lazy` (synchronized by default). The initialization-on-demand holder idiom also works in Java.

</details>

### 26. `wait()` / `notify()` vs `sleep()`?

<details>
<summary>Answer</summary>

- `sleep()` – pauses the thread but **keeps any locks** it holds. It's a `Thread` method.
- `wait()` – **releases the monitor** and waits until `notify()`/`notifyAll()` is called. It must be called inside `synchronized`. It's an `Object` method.

</details>

### 27. What is a `ThreadLocal`?

<details>
<summary>Answer</summary>

A variable where **each thread has its own independent copy**. Android's `Looper.myLooper()` is implemented with a `ThreadLocal<Looper>`.

</details>

### 28. What are Java 8 features commonly used on Android?

<details>
<summary>Answer</summary>

Lambdas, method references, the Stream API, `Optional`, default interface methods and `java.time` (available on older Android versions through **core library desugaring**).

</details>

---

[⬅ Previous: Kotlin Flow](04-flow.md) · [⬅ Back to index](../README.md) · [Next: OOP & SOLID ➡](06-oop-solid.md)
