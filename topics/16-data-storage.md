# Data Storage – Room, DataStore, Files

[⬅ Back to index](../README.md)

Covers: storage options, SharedPreferences vs DataStore, Room (entities, DAO, relations, migrations, threading), SQLite, file storage & scoped storage, caching.

---

### 1. What are the storage options in Android?

<details>
<summary>Answer</summary>

| Need | Option |
|---|---|
| Small key-value settings | **DataStore** (Preferences) / SharedPreferences (legacy) |
| Small typed objects | **Proto DataStore** |
| Structured, relational, queryable data | **Room** (over SQLite) |
| Private files (cache, images, JSON) | Internal storage: `filesDir`, `cacheDir` |
| Shareable media/documents | **MediaStore**, Storage Access Framework (scoped storage) |
| Sensitive data (keys, tokens) | **Android Keystore** + encryption |
| Server-synced data | Backend + local cache (Room as SSOT) |

</details>

### 2. SharedPreferences vs DataStore?

<details>
<summary>Answer</summary>

| SharedPreferences | DataStore |
|---|---|
| Synchronous API; `getX()` can block the UI thread on first load | **Asynchronous** – Kotlin coroutines + Flow |
| `apply()` is async but may block on `fsync` at `onPause`/`onStop` → **ANRs** | Writes are transactional and off the main thread |
| No error signalling, not safe across processes | Errors are signalled through exceptions; consistent, transactional updates |
| No type safety | Proto DataStore gives **type safety** (schema) |

```kotlin
val Context.dataStore by preferencesDataStore(name = "settings")
val DARK = booleanPreferencesKey("dark_mode")
val darkMode: Flow<Boolean> = context.dataStore.data.map { it[DARK] ?: false }
suspend fun setDark(v: Boolean) = context.dataStore.edit { it[DARK] = v }
```

Rules: only **one DataStore instance per file**. It's not meant for large or relational data (use Room). DataStore also supports KMP.

</details>

### 3. `commit()` vs `apply()` in SharedPreferences?

<details>
<summary>Answer</summary>

- `commit()` – writes **synchronously** to disk and returns a `Boolean` for success. Don't call it on the main thread.
- `apply()` – updates memory immediately and writes to disk **asynchronously**. Returns nothing. Pending applies are still waited on at lifecycle points, which can cause ANRs.

</details>

### 4. What is Room? What are its components?

<details>
<summary>Answer</summary>

Room is the Jetpack **ORM-like abstraction over SQLite**:
- **`@Entity`** – a table (data class); `@PrimaryKey`, `@ColumnInfo`, `@Index`, `@Embedded`, foreign keys.
- **`@Dao`** – data access methods: `@Query`, `@Insert`, `@Update`, `@Delete`, `@Upsert`, `@Transaction`.
- **`@Database`** – an abstract class extending `RoomDatabase`; lists entities, version and DAOs. Create a **single instance** (singleton through DI).

Benefits over raw SQLite: **compile-time SQL verification**, less boilerplate, **Flow/LiveData/suspend support**, migrations support, testing helpers. Room uses **KSP** for code generation and supports **Kotlin Multiplatform** (Room 2.7+).

</details>

### 5. Show a basic Room setup.

<details>
<summary>Answer</summary>

```kotlin
@Entity(tableName = "users")
data class UserEntity(@PrimaryKey val id: String, val name: String, val updatedAt: Long)

@Dao
interface UserDao {
    @Query("SELECT * FROM users ORDER BY name")
    fun observeAll(): Flow<List<UserEntity>>          // re-emits on table change

    @Upsert suspend fun upsertAll(users: List<UserEntity>)

    @Query("DELETE FROM users") suspend fun clear()
}

@Database(entities = [UserEntity::class], version = 1, exportSchema = true)
abstract class AppDatabase : RoomDatabase() { abstract fun userDao(): UserDao }

Room.databaseBuilder(appContext, AppDatabase::class.java, "app.db").build()
```

</details>

### 6. How does Room handle threading?

<details>
<summary>Answer</summary>

- Room **doesn't allow queries on the main thread** (it throws `IllegalStateException`) unless you call `allowMainThreadQueries()`, which you shouldn't.
- `suspend` DAO functions run on Room's internal executors, so they're main-safe.
- Functions that return `Flow`/`LiveData` run their queries in the background and **re-run them when the observed tables are invalidated** (InvalidationTracker).

</details>

### 7. How do you handle database migrations in Room?

<details>
<summary>Answer</summary>

When the schema changes, **increase the version** and provide a migration:

```kotlin
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("ALTER TABLE users ADD COLUMN email TEXT")
    }
}
Room.databaseBuilder(...).addMigrations(MIGRATION_1_2)
```

- **AutoMigrations** (`@Database(autoMigrations = [AutoMigration(from = 1, to = 2)])`) handle simple changes. Renames and deletes need an `AutoMigrationSpec`.
- Set `exportSchema = true` and commit the schema JSON files. **Test migrations** with `MigrationTestHelper`.
- `fallbackToDestructiveMigration()` **wipes the data**. Only acceptable for pure caches.
- A missing migration → `IllegalStateException` crash on app update.

</details>

### 8. How do you model relationships in Room?

<details>
<summary>Answer</summary>

Room doesn't allow object references between entities (to avoid lazy loading on the main thread). Use:
- **One-to-one / one-to-many:** a data class with `@Embedded` parent + `@Relation(parentColumn, entityColumn)` children, queried in a `@Transaction` function.
- **Many-to-many:** a **junction (cross-ref) entity** + `@Relation(associateBy = Junction(...))`.

```kotlin
data class UserWithPosts(
    @Embedded val user: UserEntity,
    @Relation(parentColumn = "id", entityColumn = "userId") val posts: List<PostEntity>
)
@Transaction @Query("SELECT * FROM users") fun usersWithPosts(): Flow<List<UserWithPosts>>
```

</details>

### 9. What are TypeConverters?

<details>
<summary>Answer</summary>

SQLite only stores primitive types (INTEGER, REAL, TEXT, BLOB). **`@TypeConverter`** functions convert custom types (`Date`, `Instant`, enums, lists as JSON) to supported types and back. Register them with `@TypeConverters` on the Database. Avoid storing large lists as JSON if you need to query inside them; use a related table instead.

</details>

### 10. What does `@Transaction` do?

<details>
<summary>Answer</summary>

It runs multiple queries **atomically**: everything succeeds or everything rolls back. It's required for `@Relation` queries (so parent and children are read consistently). For multiple writes, use `db.withTransaction { }` (suspend) or a DAO method annotated with `@Transaction`.

</details>

### 11. How do you optimize Room / SQLite performance?

<details>
<summary>Answer</summary>

- Add **indexes** (`@Index`) to columns used in `WHERE`, `JOIN` and `ORDER BY` (indexes slow down writes, so add only what you need).
- **Batch inserts** in one transaction (`insertAll(list)`), not a loop of single inserts.
- Select only the columns you need (a POJO with a subset of fields).
- Use **Paging** for large lists.
- **WAL mode** (Write-Ahead Logging) is on by default, so reads and writes can happen concurrently.
- Use `EXPLAIN QUERY PLAN` and the Database Inspector.

</details>

### 12. What is the Database Inspector?

<details>
<summary>Answer</summary>

An Android Studio tool (App Inspection) to view, query and modify the **live** databases of a running debug app. It supports live updates for Room Flow queries.

</details>

### 13. Internal vs external storage? What is Scoped Storage?

<details>
<summary>Answer</summary>

- **Internal** (`filesDir`, `cacheDir`) – private to the app, no permission needed, deleted on uninstall. `cacheDir` can be cleared by the system.
- **App-specific external** (`getExternalFilesDir`) – also deleted on uninstall, no permission needed since API 19.
- **Shared storage** – media (MediaStore) and documents (Storage Access Framework).
- **Scoped Storage (Android 10+, enforced on 11+):** apps can't freely access the whole external storage. Use **MediaStore** for your own media (no permission needed to add your own files), `READ_MEDIA_IMAGES/VIDEO/AUDIO` (Android 13+) to read others' media, the **Photo Picker** (no permission at all), and SAF (`ACTION_OPEN_DOCUMENT`) for documents. `MANAGE_EXTERNAL_STORAGE` is only for special apps (file managers) and restricted on Play.

</details>

### 14. What is the Photo Picker?

<details>
<summary>Answer</summary>

A system UI to choose photos or videos **without granting any storage permission**. The app gets temporary URI access to only the selected items. Use `ActivityResultContracts.PickVisualMedia()` / `PickMultipleVisualMedia()`. It's backported to older versions through Google Play services. Google Play policy now **pushes apps to use the Photo Picker** instead of broad media permissions when they only need occasional access.

</details>

### 15. How do you store sensitive data (tokens, passwords)?

<details>
<summary>Answer</summary>

- Never store them in plain SharedPreferences, files or logs.
- Use the **Android Keystore** to generate or keep encryption keys in hardware-backed storage (they can't be extracted), and encrypt the data with AES-GCM before storing it (DataStore/files).
- `EncryptedSharedPreferences` (Jetpack Security) was widely used, but the **security-crypto library is now deprecated**. Prefer Keystore + your own encryption (or Tink) with DataStore.
- Store passwords only on the server (hashed). On the device, use tokens or **Credential Manager** (passkeys).

</details>

### 16. How would you implement a cache with expiry?

<details>
<summary>Answer</summary>

Store a `lastUpdated` timestamp with each item (or per-query metadata) in Room. In the repository, if `now - lastUpdated > TTL`, refresh from the network; otherwise serve the cache. For in-memory caching, use `LruCache` with a size limit plus timestamps. Combine with stale-while-revalidate: show the cached data immediately and refresh in the background.

</details>

### 17. Room vs Realm vs SQLDelight?

<details>
<summary>Answer</summary>

- **Room** – Jetpack, SQLite-based, annotation-driven, now KMP.
- **SQLDelight** – you write **SQL first**, and it generates type-safe Kotlin APIs. KMP-native. Popular in multiplatform projects.
- **Realm** – an object database (not SQLite). Its Kotlin SDK has been deprecated by MongoDB, so it's not recommended for new projects.

</details>

### 18. What is the Auto Backup / data backup in Android?

<details>
<summary>Answer</summary>

**Auto Backup** (API 23+) backs up app data (up to 25 MB) to the user's Google Drive and restores it on reinstall or a new device. Configure what to include or exclude with `android:fullBackupContent` / `dataExtractionRules` (Android 12+). **Exclude** tokens, device-specific IDs and encryption-key-dependent data, because Keystore keys aren't backed up, so restored encrypted data would be unreadable.

</details>

---

[⬅ Previous: Networking](15-networking.md) · [⬅ Back to index](../README.md) · [Next: Threading & Background Work ➡](17-threading-background-work.md)
