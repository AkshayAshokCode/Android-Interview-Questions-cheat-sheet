# Security & Permissions

[⬅ Back to index](../README.md)

Covers: permission types & runtime flow, permission changes by version, app sandbox, secure storage & Keystore, network security, obfuscation, root/tamper detection, Play Integrity, biometrics, passkeys, WebView security, exported components.

---

## Permissions

### 1. What are the types of permissions in Android?

<details>
<summary>Answer</summary>

- **Install-time / normal** – low risk, granted automatically at install (`INTERNET`, `ACCESS_NETWORK_STATE`, `VIBRATE`).
- **Signature** – granted only if the requesting app is **signed with the same certificate** as the app that defines the permission.
- **Dangerous / runtime** – access to private data or sensitive device features (camera, location, contacts, microphone, media). **The user must grant them at runtime** (API 23+).
- **Special / appop** – granted in system Settings: `SYSTEM_ALERT_WINDOW`, `SCHEDULE_EXACT_ALARM`, `MANAGE_EXTERNAL_STORAGE`, `REQUEST_INSTALL_PACKAGES`, notification listener, accessibility.

</details>

### 2. How do you request runtime permissions correctly?

<details>
<summary>Answer</summary>

1. Declare the permission in the manifest.
2. Check `ContextCompat.checkSelfPermission()`. If it's already granted, proceed.
3. If `shouldShowRequestPermissionRationale()` is true (the user denied it before), **explain why** you need it in your own UI first.
4. Request it with the **Activity Result API**:

```kotlin
val launcher = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
    if (granted) openCamera() else showDeniedState()
}
launcher.launch(Manifest.permission.CAMERA)
```

5. Handle **permanent denial** (no rationale and denied, i.e. "Don't ask again"): guide the user to app settings (`Settings.ACTION_APPLICATION_DETAILS_SETTINGS`).

Best practices: request **in context** (when the user taps the feature, not at launch), request the **minimum** needed, degrade gracefully if denied. In Compose: `rememberLauncherForActivityResult`, or Accompanist permissions.

</details>

### 3. What permission changes happened in recent Android versions?

<details>
<summary>Answer</summary>

- **6.0 (23)** – runtime permissions.
- **10 (29)** – `ACCESS_BACKGROUND_LOCATION` is separate; scoped storage introduced.
- **11 (30)** – **one-time permissions** (“Only this time”); **auto-reset** of permissions for unused apps; background location must be granted from Settings; package visibility (`<queries>`).
- **12 (31)** – **approximate vs precise location** (the user can choose `COARSE` only); Bluetooth permissions (`BLUETOOTH_SCAN`/`CONNECT`); mic and camera toggles and indicators; `SCHEDULE_EXACT_ALARM`.
- **13 (33)** – **`POST_NOTIFICATIONS`** runtime permission; granular media permissions (`READ_MEDIA_IMAGES/VIDEO/AUDIO`) replace `READ_EXTERNAL_STORAGE`; `NEARBY_WIFI_DEVICES`.
- **14 (34)** – **partial photo/video access** (`READ_MEDIA_VISUAL_USER_SELECTED`, "Select photos"); FGS type permissions; exact alarms denied by default.
- **15/16** – stricter FGS rules; Health Connect permissions (moving from body-sensor permissions to granular health permissions); Play policy pushing the **Photo Picker** over broad media access.

</details>

### 4. How do you handle location permissions properly?

<details>
<summary>Answer</summary>

Request `ACCESS_FINE_LOCATION` **together with** `ACCESS_COARSE_LOCATION` (on 12+ the user can choose approximate). Handle the case where only coarse is granted. Request **background location separately and later** (incremental), only if you really need it. It requires Play policy review. Use the **Fused Location Provider**, and stop updates when they're not needed.

</details>

### 5. How can you define custom permissions?

<details>
<summary>Answer</summary>

Declare `<permission android:name="com.app.permission.READ_DATA" android:protectionLevel="signature"/>` and protect components with `android:permission=`. Use `signature` level so that only your own apps (signed with the same key) can access exported components such as a Content Provider.

</details>

---

## App Security

### 6. What is the Android application sandbox?

<details>
<summary>Answer</summary>

Each app gets a **unique Linux UID** and runs in its **own process**. Its private files (`/data/data/<pkg>`) can't be read by other apps. This is reinforced by **SELinux** (mandatory access control), seccomp filters and permissions. Apps communicate only through defined IPC channels (Intents, Binder, Content Providers).

</details>

### 7. How do you store sensitive data securely?

<details>
<summary>Answer</summary>

- Use the **Android Keystore** to generate keys in secure hardware (**TEE/StrongBox**). Keys are **non-exportable**, and you can require user authentication (biometric) to use them.
- Encrypt data with **AES-256-GCM** using those keys, then store the ciphertext in DataStore, files or Room (or use **SQLCipher** for full-database encryption).
- `EncryptedSharedPreferences`/`EncryptedFile` (Jetpack security-crypto) were the common approach, but the **library is now deprecated**. Use the Keystore directly or Google **Tink**.
- **Never**: hardcode API secrets, log tokens, store passwords on the device, or keep PII in plain text. Exclude secrets from backups.

</details>

### 8. How do you protect API keys in an Android app?

<details>
<summary>Answer</summary>

**Anything in the APK can be extracted** (decompiled with jadx/apktool, or captured with a proxy). Mitigations:
- Keep **secrets on the backend**: the app calls your server, and the server calls third parties.
- Use **short-lived tokens** (OAuth), and restrict keys by package name and SHA-1 signature (Google Maps keys support this).
- Keep keys out of source control (`local.properties` / CI secrets → `BuildConfig`). This only protects the repo, not the APK.
- Obfuscation and NDK storage only **slow attackers down**.
- **Play Integrity API** to verify that requests come from your genuine app.

</details>

### 9. How do you secure network communication?

<details>
<summary>Answer</summary>

- **HTTPS everywhere**. Cleartext is blocked by default (API 28+) through the **Network Security Config** (`res/xml/network_security_config.xml`).
- **Certificate pinning** (OkHttp `CertificatePinner` or the NSC `<pin-set>` with an expiration) prevents MITM even with user-installed CAs. Always include **backup pins** and plan key rotation, or you'll lock users out.
- Since API 24, apps don't trust **user-added CAs** by default.
- Don't disable SSL validation (no "trust all" `TrustManager`). Play rejects apps that do.

</details>

### 10. What is code obfuscation and why use R8?

<details>
<summary>Answer</summary>

R8 renames classes and methods to meaningless names, removes unused code and optimizes. This makes **reverse engineering harder** (but not impossible) and reduces size. Keep `mapping.txt` for crash de-obfuscation. Sensitive logic should still live on the server. For extra protection, use commercial tools (DexGuard) for string encryption and tamper detection.

</details>

### 11. What is the Play Integrity API? (and SafetyNet)

<details>
<summary>Answer</summary>

**Play Integrity** (it **replaced SafetyNet Attestation**, now shut down) lets your **backend** verify that a request comes from:
- your **genuine app binary** (unmodified, installed from Play),
- a **genuine certified Android device** (not an emulator or a rooted device that fails integrity checks),
- a **licensed user**.

Flow: the app requests an integrity token with a nonce or request hash → sends it to your server → the server decrypts and verifies it with Google → decides whether to allow the request. **Always verify on the server.**

</details>

### 12. How do you detect rooted devices or tampering?

<details>
<summary>Answer</summary>

Use the Play Integrity verdicts (preferred), plus heuristics: checking for `su` binaries, test-keys builds, Magisk, and hooking frameworks (Frida/Xposed); verifying the app's **signing certificate** at runtime; checking whether a debugger is attached. Client-side checks can be bypassed, so treat them as signals and make the decision on the server.

</details>

### 13. How do you secure exported components?

<details>
<summary>Answer</summary>

- Set `android:exported="false"` unless other apps genuinely need access (it's required to be explicit on 12+ for components with intent filters).
- Protect exported components with **permissions** (signature level).
- **Validate all incoming Intent data** (deep link parameters!). Never trust extras.
- Avoid **intent redirection** (forwarding an untrusted nested Intent).
- Use **immutable PendingIntents**.
- Content Providers: `exported=false`, `grantUriPermissions` for temporary access, parameterized queries to prevent **SQL injection**.

</details>

### 14. What are WebView security best practices?

<details>
<summary>Answer</summary>

- Keep **JavaScript disabled** unless it's needed.
- Use `addJavascriptInterface` only with trusted content (and only `@JavascriptInterface` methods are exposed).
- Disable file access (`allowFileAccess = false`, no universal access from file URLs).
- Validate URLs in `shouldOverrideUrlLoading`, and load only HTTPS from trusted domains.
- Don't ignore SSL errors in `onReceivedSslError`.
- Use `WebViewAssetLoader` for local content.

</details>

### 15. How do you implement biometric authentication?

<details>
<summary>Answer</summary>

Use the **AndroidX Biometric library** (`BiometricPrompt`). Choose the authenticators: `BIOMETRIC_STRONG`, `BIOMETRIC_WEAK`, `DEVICE_CREDENTIAL`. Check `BiometricManager.canAuthenticate()` first. For real security, tie it to a **Keystore key** with `setUserAuthenticationRequired(true)` and pass a `CryptoObject`, so authentication actually unlocks a key (rather than being a UI-only check).

</details>

### 16. What are Passkeys / Credential Manager?

<details>
<summary>Answer</summary>

**Credential Manager** (Jetpack) is the unified API for sign-in: **passkeys**, saved passwords and **Sign in with Google** in a single bottom sheet. It replaces Smart Lock and the older Google Sign-In APIs.

**Passkeys** (FIDO2/WebAuthn) are **phishing-resistant**, passwordless credentials. A private key stays on the device and syncs through the password manager; the server stores only the public key. They're increasingly asked about as a modern auth topic.

</details>

### 17. What is OAuth 2.0 / how do you implement login securely?

<details>
<summary>Answer</summary>

Use **Authorization Code flow with PKCE** in **Custom Tabs** (not a WebView), for example with AppAuth. Exchange the code for **access + refresh tokens**, keep the access token short-lived, store the refresh token encrypted, refresh on 401 through OkHttp's Authenticator, and clear everything on logout. Never put a client secret in the app.

</details>

### 18. What are common mobile security risks (OWASP Mobile Top 10)?

<details>
<summary>Answer</summary>

Improper credential usage (hardcoded secrets), insecure authentication and authorization, insufficient input/output validation, insecure communication, inadequate privacy controls, insufficient binary protections, security misconfiguration (exported components, debuggable release builds), insecure data storage, insufficient cryptography, and supply-chain risks (third-party SDKs).

</details>

### 19. How do you prevent screenshots or screen recording of sensitive screens?

<details>
<summary>Answer</summary>

Set `window.setFlags(FLAG_SECURE, FLAG_SECURE)` on the Activity. It blocks screenshots and recordings, and hides content in Recents. Android 14 also added a **screenshot detection** callback (`registerScreenCaptureCallback`). For one sensitive Compose screen, apply the flag while that screen is shown.

</details>


---

## Cryptography Basics & OTP

### 20. Hashing vs encryption vs encoding?

<details>
<summary>Answer</summary>

| | Purpose | Reversible? | Key? | Examples |
|---|---|---|---|---|
| **Encoding** | Represent data in another format for transport or storage | **Yes**, by anyone | No | Base64, URL encoding, UTF-8 |
| **Encryption** | **Confidentiality**: only key holders can read | **Yes**, with the key | Yes | AES-GCM, RSA |
| **Hashing** | **Integrity / fingerprint**: a fixed-size digest | **No** (one-way) | No (HMAC uses one) | SHA-256, bcrypt/Argon2 for passwords |

Base64 is **not security**. Passwords are stored as **salted, slow hashes** (bcrypt/scrypt/Argon2) on the server, never encrypted. Use **HMAC** for message authentication, and hashes for checksums (verifying downloaded files).

</details>

### 21. Symmetric vs asymmetric encryption?

<details>
<summary>Answer</summary>

- **Symmetric** (AES) – the **same secret key** encrypts and decrypts. **Fast**, so it's used for bulk data (local file and DB encryption with an AES key kept in the Android Keystore). The problem is distributing the key securely.
- **Asymmetric** (RSA, ECC) – a **public key** encrypts or verifies, and a **private key** decrypts or signs. Slower, but it solves key exchange and enables **digital signatures** (APK signing, JWT verification, passkeys).
- **In practice they're combined:** TLS uses asymmetric crypto (ECDHE + certificates) to **agree on a symmetric session key**, then AES for the data. End-to-end encrypted chats (Signal protocol) work the same way.

</details>

### 22. How do you read OTPs automatically? (SMS Retriever API)

<details>
<summary>Answer</summary>

Apps **can't** use `READ_SMS` for OTPs (it's a restricted Play policy permission). Use:
- **SMS Retriever API** (Play services) – **no permission needed**. The app calls `SmsRetriever.getClient(ctx).startSmsRetriever()`. The server sends an SMS that ends with the app's **11-character hash** (derived from the package name and signing certificate). Play services delivers it through a broadcast (`SMS_RETRIEVED_ACTION`) within 5 minutes. Fully automatic.
- **SMS User Consent API** – for when you can't control the SMS format. The system shows a **one-tap consent prompt** for one message containing a code.
- Compose and Views also support **autofill** hints (`ContentType.SmsOtpCode` / `autofillHints="smsOTPCode"`).

</details>

---

[⬅ Previous: Testing](20-testing.md) · [⬅ Back to index](../README.md) · [Next: Build, Gradle & Release ➡](22-build-gradle-release.md)
