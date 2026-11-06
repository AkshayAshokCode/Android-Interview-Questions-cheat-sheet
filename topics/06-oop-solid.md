# OOP & SOLID Principles

[⬅ Back to index](../README.md)

Covers: the four OOP pillars, composition vs inheritance, SOLID with Android examples, DRY/KISS/YAGNI, coupling & cohesion.

---

## OOP

### 1. What are the four pillars of OOP?

<details>
<summary>Answer</summary>

1. **Encapsulation** – hide internal state and expose behaviour through methods (`private val _state` + public read-only `state`).
2. **Abstraction** – expose *what* something does, not *how* (interfaces like `UserRepository`).
3. **Inheritance** – reuse and extend behaviour through "is-a" relationships (`BaseActivity`).
4. **Polymorphism** – one interface, many implementations (overriding = runtime, overloading = compile time).

</details>

### 2. Encapsulation vs abstraction?

<details>
<summary>Answer</summary>

- **Abstraction** is a design-level idea: hide complexity and show only the essential operations (an interface).
- **Encapsulation** is an implementation-level idea: bundle data with the methods that use it and restrict direct access (access modifiers).

Abstraction is "what to show"; encapsulation is "how to hide".

</details>

### 3. Composition vs inheritance? Why "favour composition"?

<details>
<summary>Answer</summary>

- **Inheritance** ("is-a") couples the subclass tightly to the parent's implementation. Deep hierarchies (e.g. `BaseActivity` → `BaseLoginActivity` → …) become rigid and fragile.
- **Composition** ("has-a") builds behaviour from smaller objects that can be swapped at runtime, injected and tested.

On Android, prefer composition: inject helpers, use Kotlin delegation (`by`), lifecycle observers and Compose composables instead of base classes.

</details>

### 4. What is the difference between association, aggregation and composition?

<details>
<summary>Answer</summary>

- **Association** – a general relationship (a Teacher ↔ a Student).
- **Aggregation** – a weak "has-a"; the part can exist on its own (a Team has Players).
- **Composition** – a strong "has-a"; the part's lifecycle depends on the whole (a House has Rooms).

</details>

### 5. What is coupling and cohesion?

<details>
<summary>Answer</summary>

- **Coupling** – how much one module depends on another. Aim for **low coupling** (depend on interfaces, use DI).
- **Cohesion** – how closely related the responsibilities inside a module are. Aim for **high cohesion** (each class does one focused job).

</details>

---

## SOLID

### 6. What are the SOLID principles?

<details>
<summary>Answer</summary>

- **S** – Single Responsibility
- **O** – Open/Closed
- **L** – Liskov Substitution
- **I** – Interface Segregation
- **D** – Dependency Inversion

They make code easier to maintain, test and extend.

</details>

### 7. Single Responsibility Principle (SRP) – with Android example.

<details>
<summary>Answer</summary>

"A class should have **only one reason to change**."

❌ An Activity that makes network calls, parses JSON, saves to the DB and renders the UI.
✅ Split it: Activity/Composable (render UI) → ViewModel (UI state) → UseCase (business rule) → Repository (data coordination) → DataSource (API/DB).

Likewise, a RecyclerView Adapter should only bind data to views. Formatting logic goes elsewhere.

</details>

### 8. Open/Closed Principle (OCP) – with example.

<details>
<summary>Answer</summary>

"Open for **extension**, closed for **modification**." Add new behaviour by adding code, not by editing tested code.

```kotlin
interface PaymentMethod { fun pay(amount: Double) }
class CardPayment : PaymentMethod { ... }
class UpiPayment : PaymentMethod { ... }   // new method → new class, no `when` edits
class Checkout(private val method: PaymentMethod) { fun pay(a: Double) = method.pay(a) }
```

Android examples: adding a new RecyclerView view type through a delegate adapter, or OkHttp `Interceptor`s.

</details>

### 9. Liskov Substitution Principle (LSP) – with example.

<details>
<summary>Answer</summary>

"Subtypes must be **substitutable** for their base types without breaking correctness."

Classic violation: `Square extends Rectangle`. Setting the width also changes the height, which breaks callers that expect a `Rectangle`.
Android example: a `ReadOnlyFileRepository` that overrides `save()` to throw `UnsupportedOperationException` violates LSP. It shouldn't implement a writable interface in the first place.

</details>

### 10. Interface Segregation Principle (ISP) – with example.

<details>
<summary>Answer</summary>

"Clients shouldn't be forced to depend on methods they don't use." Prefer several small interfaces over one fat interface.

Android example: the old `TextWatcher` forces you to implement 3 methods even when you need one (which is why `doAfterTextChanged {}` exists). `View.OnClickListener` and `OnLongClickListener` are separate. Split a big `UserRepository` into `UserReader` and `UserWriter` if different clients need different parts.

</details>

### 11. Dependency Inversion Principle (DIP) – with example.

<details>
<summary>Answer</summary>

"High-level modules shouldn't depend on low-level modules; **both should depend on abstractions**."

```kotlin
interface UserRepository { suspend fun getUser(id: String): User }
class UserRepositoryImpl(private val api: UserApi, private val dao: UserDao) : UserRepository
class ProfileViewModel(private val repo: UserRepository) : ViewModel()   // depends on interface
```

The ViewModel doesn't know about Retrofit or Room, so you can swap in a fake for tests. DIP is the **principle**; Dependency Injection (Hilt/Koin) is a **technique** for applying it.

</details>

### 12. Which SOLID principle does Clean Architecture rely on most?

<details>
<summary>Answer</summary>

**DIP.** The domain layer defines interfaces (repositories), and the data layer implements them, so dependencies point inward toward the domain. SRP and ISP also show up in single-purpose UseCases.

</details>

---

## Other Principles

### 13. What are DRY, KISS, YAGNI?

<details>
<summary>Answer</summary>

- **DRY** (Don't Repeat Yourself) – each piece of knowledge has one source of truth. Don't over-apply it, though: duplication is better than the wrong abstraction.
- **KISS** (Keep It Simple, Stupid) – the simplest solution that works.
- **YAGNI** (You Aren't Gonna Need It) – don't build features or abstractions "for later".

</details>

### 14. What is the Law of Demeter?

<details>
<summary>Answer</summary>

"Only talk to your immediate friends." Avoid chains like `order.customer.address.city.name`. They couple you to the internal structure of many classes. Ask the object to do the work instead (`order.shippingCity()`).

</details>

### 15. What is separation of concerns?

<details>
<summary>Answer</summary>

Divide a program into distinct sections that each handle one concern: UI, presentation logic, business rules, data access. It's the foundation of MVVM/MVI and Clean Architecture.

</details>

### 16. What is cyclomatic complexity / code smells you look for in code review?

<details>
<summary>Answer</summary>

Cyclomatic complexity is the number of independent paths through code (branches). High complexity makes code harder to test. Common smells: god classes (huge Activities), long methods, deep nesting, magic numbers, duplicated code, long parameter lists, feature envy, primitive obsession (use value classes), and `!!` everywhere.

</details>

---

[⬅ Previous: Java](05-java.md) · [⬅ Back to index](../README.md) · [Next: Design Patterns ➡](07-design-patterns.md)
