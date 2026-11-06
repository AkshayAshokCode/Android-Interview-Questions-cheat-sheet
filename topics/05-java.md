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

## More Core Java

### 29. What are the 8 primitive types? `int` vs `Integer`?

<details>
<summary>Answer</summary>

Primitives: `byte`, `short`, `int`, `long`, `float`, `double`, `char`, `boolean`.

| `int` | `Integer` |
|---|---|
| Primitive value, stored directly | Object wrapper on the heap |
| Can't be `null` | Can be `null` (unboxing a null throws an NPE) |
| Default value `0` | Default `null` |
| Usable in arrays and math directly | Needed for generics/collections (`List<Integer>`) |

**Autoboxing/unboxing** converts between them automatically. That has a cost (allocations in loops).
**Integer cache:** `Integer.valueOf()` caches values from **-128 to 127**, so `Integer a = 127, b = 127; a == b` is `true`, but with 128 it's `false`. Always compare wrappers with `equals()`.

</details>

### 30. Can static methods be overridden? When does a static block run?

<details>
<summary>Answer</summary>

- **No.** Static methods are resolved at **compile time** based on the reference type. A subclass declaring the same static method **hides** the parent's method (method hiding); it doesn't override it, so there's no polymorphism.
- A **static initializer block** (`static { … }`) runs **once, when the class is loaded/initialized** (on first use: creating an instance, accessing a static member), before any constructor.
- Instance initializer blocks run on every object creation, before the constructor body.

</details>

### 31. Shallow copy vs deep copy?

<details>
<summary>Answer</summary>

- **Shallow copy** copies the object's fields. Referenced objects are **shared**, so mutating a nested list in the copy changes the original too. Examples: `Object.clone()` by default, Kotlin `data class copy()`, `ArrayList(other)`.
- **Deep copy** recursively copies the referenced objects as well, so the copy is fully independent. Done manually (copy constructors), through serialization, or with immutable data structures (where sharing is safe).

Interview tip: prefer **immutability**. Then shallow copies are safe, and that's why data classes plus immutable lists work well.

</details>

### 32. What is serialization? What do `transient` and `serialVersionUID` do?

<details>
<summary>Answer</summary>

**Serialization** converts an object into a byte stream (to store it or send it), and **deserialization** rebuilds it. In Java, implement `Serializable` (a marker interface).
- **`transient`** – this field is **not serialized** (passwords, caches, non-serializable references). It's restored with its default value.
- **`serialVersionUID`** – a version ID. If the class changes and the IDs don't match, deserialization throws `InvalidClassException`. Declare it explicitly.

On Android, use **Parcelable** for IPC/Bundles, and JSON/Protobuf (kotlinx.serialization) for storage and network.

</details>

### 33. What is reflection? Why is it discouraged on Android?

<details>
<summary>Answer</summary>

Reflection is **inspecting and invoking classes, methods and fields at runtime** (`Class.forName`, `getDeclaredMethod`, `field.setAccessible(true)`). Gson, older DI libraries and some test tools use it.

Downsides: **slow**, no compile-time safety, it **breaks with R8 obfuscation/shrinking** unless you add keep rules, and it can access private APIs (non-SDK interface restrictions since Android 9). Prefer **code generation** (KSP).

</details>

### 34. What are anonymous classes, inner classes and lambdas in Java?

<details>
<summary>Answer</summary>

- **Static nested class** – no reference to the outer instance.
- **Inner (non-static) class** – holds an implicit reference to the outer instance, which is a **leak risk** on Android.
- **Anonymous class** – an inline one-off implementation (`new Runnable() { … }`). It also captures the outer instance when declared in an instance context.
- **Lambda** (Java 8) – shorter syntax for functional interfaces. It only captures `this` if it uses outer members, and it can only capture **effectively final** local variables.

</details>

### 35. `throw` vs `throws`?

<details>
<summary>Answer</summary>

- **`throw`** – a statement that **actually throws** an exception instance: `throw new IllegalArgumentException("bad id");`.
- **`throws`** – part of a method **signature** that **declares** the checked exceptions the method may throw: `void read() throws IOException`.

</details>

### 36. Fail-fast vs fail-safe iterators?

<details>
<summary>Answer</summary>

- **Fail-fast** (`ArrayList`, `HashMap` iterators) – they detect structural modification during iteration (through a `modCount` check) and throw **`ConcurrentModificationException`**.
- **Fail-safe / weakly consistent** (`CopyOnWriteArrayList`, `ConcurrentHashMap`) – they iterate over a **snapshot** or tolerate concurrent changes and **don't throw**. The iteration may not reflect the latest updates.

</details>

### 37. Object-level lock vs class-level lock? What is a monitor?

<details>
<summary>Answer</summary>

Every Java object has an intrinsic lock (**monitor**). `synchronized` acquires it.
- **Object-level lock**: `synchronized` instance methods or `synchronized(this)`. Threads using **different instances** don't block each other.
- **Class-level lock**: `static synchronized` methods or `synchronized(MyClass.class)`. **One lock for the whole class**, shared across all instances. It protects static state.

The monitor also provides `wait()`/`notify()` for thread coordination.

</details>

### 38. Concurrency vs parallelism?

<details>
<summary>Answer</summary>

- **Concurrency** – dealing with **multiple tasks that make progress over overlapping periods**. They may interleave on one core (task switching). It's about *structure*.
- **Parallelism** – tasks literally **run at the same time** on multiple cores. It's about *execution*.

Coroutines give you concurrency. Running them on `Dispatchers.Default` with several cores gives you parallelism.

</details>

### 39. What is `ThreadPoolExecutor`? Why use thread pools?

<details>
<summary>Answer</summary>

`ThreadPoolExecutor` is the configurable implementation behind `Executors.*`:
- **corePoolSize** – threads kept alive; **maximumPoolSize** – the upper bound.
- **workQueue** – holds tasks waiting for a thread (bounded or unbounded).
- **keepAliveTime** – how long extra (non-core) threads stay idle before they're removed.
- **RejectedExecutionHandler** – what happens when the queue and pool are full (`AbortPolicy`, `CallerRunsPolicy`, `DiscardPolicy`, `DiscardOldestPolicy`).

**Advantages of pools:** they reuse threads (no creation cost per task), **bound concurrency** (no resource exhaustion), and give you queuing, scheduling and lifecycle management (`shutdown()`).

</details>

### 40. What are atomic classes and CAS?

<details>
<summary>Answer</summary>

`AtomicInteger`, `AtomicLong`, `AtomicBoolean` and `AtomicReference` provide **lock-free thread-safe** operations using **Compare-And-Swap (CAS)** CPU instructions:
- `get()` / `set()` – volatile read and write.
- `compareAndSet(expected, new)` – atomically sets the value **only if** the current value equals `expected`, and returns whether it succeeded.
- `incrementAndGet()`, `getAndUpdate {}` – atomic read-modify-write (CAS retry loops).
- `lazySet()` – an eventual write with weaker ordering (cheaper; other threads may see it slightly later).
- `weakCompareAndSet()` – may fail spuriously; for use in retry loops.

They're faster than locks for single variables under low or medium contention.

</details>

### 41. `Runnable` vs `Thread` vs `Callable`? Daemon vs user threads?

<details>
<summary>Answer</summary>

- **`Runnable`** – a **task** (`run()`, no result, can't throw checked exceptions).
- **`Callable<V>`** – a task that **returns a value** and can throw; submitted to an executor, it gives back a `Future<V>`.
- **`Thread`** – the **execution context** that runs a task. Prefer passing Runnables to executors over subclassing Thread (separate the task from the mechanism).
- **User threads** keep the JVM alive until they finish. **Daemon threads** (`setDaemon(true)`) don't. The JVM exits when only daemon threads remain (used for background housekeeping like GC). On Android, the process lifecycle is controlled by the system anyway.

</details>

---

[⬅ Previous: Kotlin Flow](04-flow.md) · [⬅ Back to index](../README.md) · [Next: OOP & SOLID ➡](06-oop-solid.md)
