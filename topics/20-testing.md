# Testing

[⬅ Back to index](../README.md)

Covers: testing pyramid, unit tests, test doubles (mocks/fakes), MockK/Mockito, testing ViewModels/coroutines/Flow, Robolectric, Espresso, Compose UI tests, screenshot tests, TDD.

---

### 1. What types of tests exist in Android? What is the testing pyramid?

<details>
<summary>Answer</summary>

- **Unit tests** (`src/test`, local JVM) – fast and isolated: ViewModels, UseCases, Repositories, mappers. **~70%** of tests.
- **Integration tests** – several units together (Repository + Room in-memory DB, API + MockWebServer). Can be local (Robolectric) or instrumented.
- **UI / end-to-end tests** (`src/androidTest`, device/emulator) – Espresso, Compose UI tests, UI Automator. Slow and flaky, so keep them for **critical flows** only. **~10%**.

The pyramid: many fast unit tests at the bottom, fewer integration tests, very few E2E tests at the top.

</details>

### 2. Local tests vs instrumented tests?

<details>
<summary>Answer</summary>

| Local (`test/`) | Instrumented (`androidTest/`) |
|---|---|
| Run on the JVM | Run on a device or emulator |
| Fast, no Android framework (unless Robolectric) | Real Android framework |
| JUnit, MockK, Turbine, Robolectric | Espresso, Compose test, UI Automator, Room tests |

</details>

### 3. What are test doubles? Mock vs Stub vs Fake vs Spy?

<details>
<summary>Answer</summary>

- **Dummy** – passed in but never used.
- **Stub** – returns canned answers.
- **Fake** – a **working lightweight implementation** (an in-memory repository). **Google recommends fakes** over mocks: they're more realistic, reusable, and less brittle.
- **Mock** – a programmable object that **verifies interactions** (`verify { api.call() }`).
- **Spy** – wraps a real object and records calls, with the option to stub some of them.

</details>

### 4. MockK vs Mockito?

<details>
<summary>Answer</summary>

**MockK** is Kotlin-first: it supports `final` classes (Kotlin's default), `object`s, extension functions, top-level functions, coroutines (`coEvery`, `coVerify`), and relaxed mocks.
**Mockito** is Java-first; use `mockito-kotlin` + the inline mock maker (the default since Mockito 5) for final classes.

```kotlin
val repo = mockk<UserRepository>()
coEvery { repo.getUser("1") } returns User("1", "Akshay")
coVerify(exactly = 1) { repo.getUser("1") }
```

</details>

### 5. How do you unit test a ViewModel?

<details>
<summary>Answer</summary>

```kotlin
class MainDispatcherRule(val dispatcher: TestDispatcher = UnconfinedTestDispatcher()) : TestWatcher() {
    override fun starting(d: Description) = Dispatchers.setMain(dispatcher)
    override fun finished(d: Description) = Dispatchers.resetMain()
}

class ProfileViewModelTest {
    @get:Rule val mainRule = MainDispatcherRule()
    private val repo = FakeUserRepository()

    @Test fun `loads user successfully`() = runTest {
        repo.setUser(User("1", "Akshay"))
        val vm = ProfileViewModel(repo)
        vm.uiState.test {                        // Turbine
            assertEquals(UiState.Success(User("1", "Akshay")), awaitItem())
        }
    }

    @Test fun `shows error when repo fails`() = runTest {
        repo.shouldFail = true
        val vm = ProfileViewModel(repo)
        assertTrue(vm.uiState.value is UiState.Error)
    }
}
```

Key points: replace `Dispatchers.Main`, inject fakes, use `runTest`, and test **state outputs** for given **inputs/events** (not implementation details).

</details>

### 6. How do you test coroutines and time-based code?

<details>
<summary>Answer</summary>

`runTest` uses virtual time, so `delay(10_000)` completes instantly. Use `StandardTestDispatcher` with `advanceTimeBy()`, `advanceUntilIdle()` and `runCurrent()` for fine control. Inject `TestDispatcher` wherever production code uses `Dispatchers.IO`. Use `backgroundScope` for collectors that never complete. See [Coroutines Q27](03-coroutines.md).

</details>

### 7. How do you test LiveData?

<details>
<summary>Answer</summary>

Add `InstantTaskExecutorRule` (it makes Architecture Components run tasks synchronously), then observe with `observeForever` or a `getOrAwaitValue()` extension helper.

</details>

### 8. How do you test Room DAOs and migrations?

<details>
<summary>Answer</summary>

Use `Room.inMemoryDatabaseBuilder(context, AppDatabase::class.java).allowMainThreadQueries().build()` in an instrumented test (or with Robolectric), insert data, query, assert, and close the DB in `@After`. Test migrations with `MigrationTestHelper` using the exported schemas.

</details>

### 9. How do you test the network layer?

<details>
<summary>Answer</summary>

Use **MockWebServer** (OkHttp) to enqueue fake responses (`MockResponse().setBody(json).setResponseCode(200)`), point Retrofit's `baseUrl` at `server.url("/")`, then assert the parsed results and the requests the client sent (`server.takeRequest().path`). Test error codes and malformed JSON too.

</details>

### 10. What is Robolectric?

<details>
<summary>Answer</summary>

Robolectric runs Android framework code on the **JVM** (shadowing Android classes), so tests that need `Context`, resources or Activities run as **fast local tests**, without an emulator. Good for logic tests that touch Android APIs, and for Compose/screenshot tests (Roborazzi). It's less faithful than a real device.

</details>

### 11. What is Espresso? What is idling?

<details>
<summary>Answer</summary>

Espresso is the UI testing framework for Views:

```kotlin
onView(withId(R.id.email)).perform(typeText("a@b.com"), closeSoftKeyboard())
onView(withId(R.id.login)).perform(click())
onView(withText("Welcome")).check(matches(isDisplayed()))
```

It **automatically synchronizes** with the UI thread's message queue and AsyncTasks. For other async work (coroutines, custom thread pools, network) you register **IdlingResources**, or inject test dispatchers, so it waits instead of failing. **Never use `Thread.sleep()`** in tests (it causes flakiness).

</details>

### 12. How do you test Jetpack Compose UI?

<details>
<summary>Answer</summary>

`createComposeRule()` + semantics finders (`onNodeWithText`, `onNodeWithTag`, `onNodeWithContentDescription`) + actions (`performClick`, `performTextInput`) + assertions (`assertIsDisplayed`, `assertIsEnabled`). Test **stateless composables** by passing state and lambdas. Use `composeTestRule.mainClock` to control animations. See [Compose Q32](11-jetpack-compose.md).

</details>

### 13. What are screenshot tests?

<details>
<summary>Answer</summary>

They render UI and compare it with **golden images** to catch visual regressions. Tools: **Paparazzi** (JVM, no device), **Roborazzi** (Robolectric-based), **Compose Preview Screenshot Testing** (Google's tool, built on `@Preview`). Fast feedback for design systems and themes (dark mode, font scale, locales).

</details>

### 14. What is UI Automator?

<details>
<summary>Answer</summary>

A framework for **cross-app and system UI** testing: notifications, permission dialogs, settings, the home screen. Espresso can't interact with UI outside your app. Also used in Macrobenchmark to drive user journeys.

</details>

### 15. What is TDD? What makes code testable?

<details>
<summary>Answer</summary>

**TDD**: **Red** (write a failing test) → **Green** (minimal code to pass) → **Refactor**.

Testable code: **dependency injection** (constructor params), depending on **interfaces**, **injected dispatchers and clocks**, small single-responsibility classes, no static or global state, no Android classes in the domain or ViewModel, pure functions.

</details>

### 16. What is a good unit test? (FIRST / AAA)

<details>
<summary>Answer</summary>

- **AAA:** Arrange → Act → Assert.
- **FIRST:** Fast, Isolated/Independent, Repeatable, Self-validating, Timely.
- One behaviour per test, with **descriptive names** (`` `returns error when network fails` ``), testing **behaviour rather than implementation**, and no logic (loops, ifs) inside the test.

</details>

### 17. How do you measure code coverage? Is 100% the goal?

<details>
<summary>Answer</summary>

Use **JaCoCo** or **Kover** (Kotlin) to generate coverage reports in CI. 100% isn't the goal: aim for **meaningful coverage of business logic** (ViewModels, UseCases, mappers, edge cases). Coverage shows what's *not* tested, not whether the tests are good. Mutation testing (e.g. Pitest) checks test quality.

</details>

### 18. How do you handle flaky tests?

<details>
<summary>Answer</summary>

Find the cause: timing (replace sleeps with idling resources or test dispatchers), shared state between tests (reset it in `@Before`, use the Orchestrator's `clearPackageData`), animations (disable them on test devices), real network (use fakes or MockWebServer), and test order dependence. Run tests on **Gradle Managed Devices** or Firebase Test Lab for consistency. Quarantine flaky tests and fix them; don't just retry them.

</details>

---

[⬅ Previous: Performance & Memory](19-performance-memory.md) · [⬅ Back to index](../README.md) · [Next: Security & Permissions ➡](21-security-permissions.md)
