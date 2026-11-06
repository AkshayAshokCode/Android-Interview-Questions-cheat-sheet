# Dependency Injection – Hilt, Dagger, Koin

[⬅ Back to index](../README.md)

Covers: DI concepts, Dagger 2 internals, Hilt components & scopes, qualifiers, assisted injection, testing, Koin, Service Locator.

---

### 1. What is Dependency Injection? Why use it?

<details>
<summary>Answer</summary>

DI means **a class receives its dependencies from outside** instead of creating them itself.

```kotlin
// ❌ class UserRepository { private val api = Retrofit.Builder()...create(UserApi::class.java) }
// ✅
class UserRepository(private val api: UserApi, private val dao: UserDao)
```

**Benefits:** loose coupling, **testability** (inject fakes), reusability, a single place to configure object graphs, and lifecycle/scope management (singletons, per-screen instances).

Types: **constructor injection** (preferred), **field injection** (for Android classes the system instantiates, like Activities), and method injection.

</details>

### 2. Dependency Injection vs Service Locator?

<details>
<summary>Answer</summary>

- **DI** – dependencies are **pushed** into the class (constructor). They're explicit and visible in the signature, and errors can be caught at **compile time** (Dagger/Hilt).
- **Service Locator** – the class **pulls** dependencies from a registry (`ServiceLocator.get<Api>()`). Simpler, but dependencies are hidden, and a missing binding fails at **runtime**.
- **Koin** is technically closer to a service locator (runtime resolution through a DSL), although constructor injection with Koin feels like DI.

</details>

### 3. What is Dagger 2? How does it work?

<details>
<summary>Answer</summary>

A **compile-time** DI framework (by Google, originally Square). An annotation processor (kapt/KSP) **generates plain Java code** that builds the dependency graph. There's no reflection, so it's fast at runtime, and **missing bindings are compile errors**.

Key annotations:
- `@Inject` – on constructors (how to create) or fields (where to inject).
- `@Module` + `@Provides` – provide objects you can't annotate (Retrofit, Room, interfaces).
- `@Binds` – bind an interface to its implementation (more efficient than `@Provides`, uses an abstract method).
- `@Component` – the **graph/injector** interface that connects modules to injection targets.
- `@Singleton` / custom `@Scope` – one instance per component.
- `@Subcomponent`, component dependencies – child graphs.
- `@Qualifier` / `@Named` – distinguish multiple bindings of the same type.

Downsides: a steep learning curve, boilerplate, and build-time cost.

</details>

### 4. What is Hilt? How is it different from Dagger?

<details>
<summary>Answer</summary>

Hilt is a DI library **built on top of Dagger**, made for Android. It provides **predefined components tied to Android lifecycles**, which removes most of Dagger's boilerplate.

- `@HiltAndroidApp` on Application – triggers code generation and creates the app-level component.
- `@AndroidEntryPoint` on Activity/Fragment/View/Service/BroadcastReceiver – enables field injection.
- `@HiltViewModel` + `@Inject constructor` – ViewModel injection (`by viewModels()`, `hiltViewModel()`).
- `@Module @InstallIn(SingletonComponent::class)` – decides where a module's bindings live.

Compared with Dagger: no manual component creation or injection calls, standard scopes, built-in testing support, and integration with Jetpack (ViewModel, WorkManager through `@HiltWorker`, Navigation, Compose). It keeps Dagger's compile-time safety.

</details>

### 5. What are Hilt components and their scopes?

<details>
<summary>Answer</summary>

| Component | Scope annotation | Lifetime |
|---|---|---|
| `SingletonComponent` | `@Singleton` | Application |
| `ActivityRetainedComponent` | `@ActivityRetainedScoped` | Survives configuration changes (like a ViewModel) |
| `ViewModelComponent` | `@ViewModelScoped` | ViewModel |
| `ActivityComponent` | `@ActivityScoped` | Activity |
| `FragmentComponent` | `@FragmentScoped` | Fragment |
| `ViewComponent` / `ViewWithFragmentComponent` | `@ViewScoped` | View |
| `ServiceComponent` | `@ServiceScoped` | Service |

Child components can use bindings from their parents. **Unscoped** bindings create a **new instance on every injection**. Scope only when you need shared state, because scoping has a cost (it uses double-checked locking).

</details>

### 6. `@Provides` vs `@Binds`?

<details>
<summary>Answer</summary>

```kotlin
@Module @InstallIn(SingletonComponent::class)
abstract class RepoModule {
    @Binds abstract fun bindUserRepo(impl: UserRepositoryImpl): UserRepository   // interface → impl
}

@Module @InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides @Singleton
    fun provideRetrofit(client: OkHttpClient): Retrofit = Retrofit.Builder()...build()
}
```

- `@Binds` – an abstract function that maps an interface to an implementation that already has an `@Inject` constructor. Generates less code and is more efficient.
- `@Provides` – a concrete function with creation logic, for third-party classes, builders or objects you can't annotate.

</details>

### 7. What are Qualifiers? When do you need them?

<details>
<summary>Answer</summary>

When there are **multiple bindings of the same type**, for example two OkHttpClients or different dispatchers:

```kotlin
@Qualifier @Retention(AnnotationRetention.BINARY) annotation class IoDispatcher

@Provides @IoDispatcher fun provideIo(): CoroutineDispatcher = Dispatchers.IO

class Repo @Inject constructor(@IoDispatcher private val io: CoroutineDispatcher)
```

`@Named("auth")` works too, but custom qualifiers are type-safe.

</details>

### 8. What is assisted injection?

<details>
<summary>Answer</summary>

Use it when an object needs **some dependencies from the graph and some at runtime** (an ID from user input):

```kotlin
class Uploader @AssistedInject constructor(
    private val api: Api, @Assisted private val fileId: String
)
@AssistedFactory interface UploaderFactory { fun create(fileId: String): Uploader }
```

Hilt also supports assisted ViewModels: `@HiltViewModel(assistedFactory = DetailVM.Factory::class)`.

</details>

### 9. What are `Lazy<T>` and `Provider<T>` in Dagger?

<details>
<summary>Answer</summary>

- `Lazy<T>` – the instance is created on the **first `get()`** and then cached (per Lazy). Defers expensive creation (good for startup).
- `Provider<T>` – each `get()` asks the graph for an instance, so you get a **new instance** if the binding is unscoped. Also useful to break dependency cycles.

</details>

### 10. How do you inject into classes Hilt doesn't support (e.g. ContentProvider)?

<details>
<summary>Answer</summary>

Use an `@EntryPoint` interface:

```kotlin
@EntryPoint @InstallIn(SingletonComponent::class)
interface ProviderEntryPoint { fun repo(): Repo }
val repo = EntryPointAccessors.fromApplication(context, ProviderEntryPoint::class.java).repo()
```

</details>

### 11. How does Hilt work with WorkManager?

<details>
<summary>Answer</summary>

Annotate the worker with `@HiltWorker` and use `@AssistedInject constructor(@Assisted context: Context, @Assisted params: WorkerParameters, repo: Repo)`. Then make the Application implement `Configuration.Provider` with a `HiltWorkerFactory`, and remove the default WorkManager initializer from the manifest.

</details>

### 12. How do you test with Hilt?

<details>
<summary>Answer</summary>

- **Unit tests:** don't use Hilt. Pass fakes through **constructors**. This is the main payoff of constructor injection.
- **Instrumented tests:** `@HiltAndroidTest` + `HiltAndroidRule`, and a custom test runner using `HiltTestApplication`.
- Replace modules with `@TestInstallIn(components = [...], replaces = [NetworkModule::class])`, or `@UninstallModules` + `@BindValue` for a single test.

</details>

### 13. What is Koin? Hilt vs Koin?

<details>
<summary>Answer</summary>

Koin is a lightweight **Kotlin DSL** DI framework that resolves dependencies at **runtime**:

```kotlin
val appModule = module {
    single { Retrofit.Builder()...build() }
    singleOf(::UserRepositoryImpl) { bind<UserRepository>() }
    viewModelOf(::ProfileViewModel)
}
```

| Hilt | Koin |
|---|---|
| Compile-time validation | Runtime resolution (`verify()` / `checkModules` tests, plus a compile-time plugin with Koin Annotations) |
| Code generation → slower builds, faster runtime | No codegen → faster builds, small runtime cost |
| Android only | **Kotlin Multiplatform** support |
| More boilerplate and a steeper learning curve | Simple, readable DSL |
| Google's recommendation | Popular in KMP projects |

</details>

### 14. What is Anvil / kotlin-inject / Metro?

<details>
<summary>Answer</summary>

Alternatives you might hear about:
- **Anvil** – a Dagger plugin from Square that simplifies multi-module DI (`@ContributesBinding`).
- **kotlin-inject** – compile-time DI for KMP.
- **Metro** – a newer compile-time DI framework implemented as a Kotlin compiler plugin; KMP-friendly.

It's enough to know they exist and why (multi-module scaling, KMP).

</details>

### 15. What is a dependency cycle and how do you fix it?

<details>
<summary>Answer</summary>

A cycle is when A needs B and B needs A. Dagger reports it as a compile error. Fix it by **redesigning** (extract a third class C that both depend on), using `Provider<T>`/`Lazy<T>` to defer creation, or by questioning whether the responsibilities are split correctly.

</details>

### 16. Can you do DI without a framework (manual DI)?

<details>
<summary>Answer</summary>

Yes. Create an `AppContainer` class in your Application that builds and holds the dependencies, and pass them through constructors or factories. Fine for small apps and good for understanding DI. It gets hard to scale (lifecycle scoping, boilerplate), which is why Hilt exists.

</details>


### 17. Dagger: Component vs Subcomponent vs component dependencies? How do custom scopes work?

<details>
<summary>Answer</summary>

- A **Component** is the injector/graph. It exposes provision methods and `inject(target)` methods.
- A **Subcomponent** is a **child graph** that inherits **all bindings** of its parent and adds its own (e.g. a `LoginSubcomponent` living as long as the login flow). It's created through a factory method on the parent.
- **Component dependencies** – a component depends on another component's **explicitly exposed** bindings only. Looser coupling, used across modules.

**Custom scopes:**
```kotlin
@Scope @Retention(AnnotationRetention.RUNTIME) annotation class ActivityScope

@ActivityScope @Subcomponent(modules = [CartModule::class])
interface CartComponent { fun inject(a: CartActivity) }

@ActivityScope class CartManager @Inject constructor()
```

A scope annotation means "**one instance per component instance**". The scope's lifetime is the lifetime of the component object **you** create and hold: create it in `onCreate` and drop it when the Activity is destroyed. Dagger doesn't know about Android lifecycles, which is exactly what Hilt adds.

</details>

### 18. How do you choose between Dagger and Hilt?

<details>
<summary>Answer</summary>

- **Hilt** – for most Android apps. It has standard components tied to Android lifecycles, far less boilerplate, Jetpack integrations (ViewModel, WorkManager, Navigation, Compose), and built-in testing support. Its trade-off is a **fixed component hierarchy**.
- **Plain Dagger** – when you need **custom component hierarchies** that Hilt doesn't model, non-Android/pure-JVM modules, SDKs/libraries (don't force Hilt on library consumers), or highly customized multi-module graphs.

You can mix them: Hilt is Dagger, so `@EntryPoint`s and custom components (`@DefineComponent`) cover most edge cases.

</details>

---

[⬅ Previous: Jetpack Components](13-jetpack-components.md) · [⬅ Back to index](../README.md) · [Next: Networking ➡](15-networking.md)
