# Accessibility & Localization

[⬅ Back to index](../README.md)

Covers: why accessibility matters, TalkBack, content descriptions, touch targets, font scaling, Compose semantics, testing accessibility; localization, plurals, RTL, per-app language, formatting.

---

## Accessibility

### 1. Why does accessibility matter? What are the main problems to solve?

<details>
<summary>Answer</summary>

Over a billion people live with some form of disability, and good accessibility also helps everyone (situational limits like sunlight or one-handed use). It's increasingly a **legal requirement** (e.g. the European Accessibility Act, in force from June 2025, and the ADA in the US).

The main problems to solve:
- **Vision:** screen reader support (TalkBack), contrast, scalable text, not relying on color alone.
- **Motor:** large touch targets, Switch Access / keyboard navigation, no gestures without alternatives.
- **Hearing:** captions, and visual alternatives for audio cues.
- **Cognitive:** clear language, predictable navigation, enough time to act, reduced motion.

</details>

### 2. How do you make Views accessible for TalkBack?

<details>
<summary>Answer</summary>

- **`contentDescription`** for meaningful images and icon-only buttons. Set it to `null` (or `importantForAccessibility="no"`) for decorative images.
- **Don't include the control type** in labels ("Play", not "Play button"), because TalkBack announces the role.
- **Labels for inputs:** `TextInputLayout` hint, or `android:labelFor`.
- **Group related content** (`android:screenReaderFocusable="true"` on the container, or `focusable` containers) so TalkBack reads "John, 3 new messages" as one item.
- **Custom actions** (`ViewCompat.addAccessibilityAction`) to replace swipe or long-press-only gestures.
- **State announcements:** `stateDescription`, `ViewCompat.setAccessibilityLiveRegion` for dynamic content, `announceForAccessibility` (sparingly; it's deprecated in recent APIs in favour of live regions and pane titles).
- **Headings** (`accessibilityHeading`) so users can navigate by heading, and a logical **traversal order** (`accessibilityTraversalBefore/After`).

</details>

### 3. How do you make Compose UI accessible?

<details>
<summary>Answer</summary>

- `contentDescription` on `Image`/`Icon` (`null` for decorative ones).
- Use built-in components (`Button`, `Checkbox`, `Switch`), which provide **roles and states** automatically. For custom ones, use `Modifier.toggleable`/`selectable`, `semantics { role = Role.Switch; stateDescription = … }`.
- **Merge** children: `Modifier.semantics(mergeDescendants = true) {}`, or the merging that `clickable` gives you automatically.
- `Modifier.semantics { heading() }`, `liveRegion = LiveRegionMode.Polite`, `customActions = listOf(CustomAccessibilityAction("Archive") { … })`.
- `clickable(onClickLabel = "Open article")` gives a better action description.
- Material components enforce **48 dp minimum touch targets** (`minimumInteractiveComponentSize`).

See [Compose Q39](11-jetpack-compose.md).

</details>

### 4. What are touch target, contrast and font scaling guidelines?

<details>
<summary>Answer</summary>

- **Touch targets:** at least **48×48 dp** (the visual icon can be smaller; extend the touchable area with padding or `TouchDelegate`).
- **Color contrast:** at least **4.5:1** for normal text and **3:1** for large text and essential icons (WCAG AA). Don't convey information by color alone (add icons or text).
- **Font scaling:** use **sp**, and test at the largest font sizes (Android 14 supports up to **200%** with non-linear scaling). Avoid fixed heights, allow text to wrap, and use scrollable containers.
- Respect **"Remove animations"** (`Settings.Global.ANIMATOR_DURATION_SCALE == 0`, `ValueAnimator.areAnimatorsEnabled()`), and dark theme or high-contrast text settings.

</details>

### 5. How do you test accessibility?

<details>
<summary>Answer</summary>

- **Manual:** navigate with **TalkBack** (swipe through the screen, and check labels, order and actions), **Switch Access**, a keyboard, and maximum font size and display size.
- **Accessibility Scanner** app: suggests fixes for contrast, touch targets and missing labels.
- **Automated:** Espresso **`AccessibilityChecks.enable()`** (ATF) runs checks on every view action; Compose UI tests assert semantics (`assertContentDescriptionEquals`, `assert(hasClickAction())`); recent Compose testing versions also support accessibility checks (`enableAccessibilityChecks()`).
- **Android Lint** accessibility checks (missing `contentDescription`, small touch targets).
- **Pre-launch reports** in the Play Console include accessibility suggestions.

</details>

### 6. What are common accessibility accommodations you've added to apps?

<details>
<summary>Answer</summary>

Give concrete examples: labelled all icon buttons; grouped list items so TalkBack reads them as a single element; added custom actions for swipe-to-delete; made layouts scroll at 200% font size; replaced color-only status indicators with icons and text; honoured reduced-motion settings for animations; added captions to videos; fixed focus order on forms; made error messages announced through live regions; increased small touch targets with `TouchDelegate`/padding.

</details>

---

## Localization & Internationalization

### 7. How do you localize an Android app?

<details>
<summary>Answer</summary>

- Put **all user-facing strings in `res/values/strings.xml`**, with translations in `values-es/`, `values-hi/`, `values-b+zh+Hant/`, and so on. Android picks them based on the device locale (with fallback logic).
- Use **placeholders** with positions (`<string name="welcome">Hi %1$s, you have %2$d items</string>`), because word order differs between languages. Never concatenate strings.
- Use **plurals** (`<plurals>` with `one`, `few`, `many`, `other`) through `resources.getQuantityString()` / `pluralStringResource()`, because rules vary by language.
- Mark untranslatable text with `translatable="false"`, and add context comments for translators.
- Localize **images, layouts and formats** where needed, and test with **pseudo-locales** (`en-XA` makes strings longer and accented, `ar-XB` mirrors the layout for RTL). Enable them with `pseudoLocalesEnabled = true` in debug builds.

</details>

### 8. How do you support RTL (right-to-left) languages?

<details>
<summary>Answer</summary>

- Set `android:supportsRtl="true"` in the manifest.
- Use **`start`/`end`** instead of `left`/`right` (`paddingStart`, `layout_marginEnd`, `layout_constraintStart_toStartOf`, `gravity="start"`).
- Mirror directional icons with `android:autoMirrored="true"` on vector drawables (back arrows), but **not** for things like media play icons or logos.
- Compose handles RTL automatically through `LocalLayoutDirection` (`Row`, `padding(start = …)`). Use `Icons.AutoMirrored.*`.
- Use `BidiFormatter` / `TextDirectionHeuristics` for mixed-direction text (e.g. an English name in an Arabic sentence).
- Test with the `ar-XB` pseudo-locale or "Force RTL layout direction" in Developer Options.

</details>

### 9. What is per-app language preference?

<details>
<summary>Answer</summary>

Since **Android 13**, users can choose a **different language per app** in system settings. Support it by:
- declaring the supported languages (`android:localeConfig="@xml/locales_config"`, or letting AGP generate it with `generateLocaleConfig = true`),
- changing the language in-app with **`AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags("hi"))`**. It's backward compatible through AppCompat (set `autoStoreLocales` in the manifest service for pre-13 devices) and recreates activities automatically.

This replaces older hacks of overriding the `Configuration` locale in `attachBaseContext`.

</details>

### 10. How do you format dates, numbers and currencies correctly for each locale?

<details>
<summary>Answer</summary>

- **Never hardcode formats** like `"MM/dd/yyyy"` or `"$" + price`.
- **Dates and times:** `java.time` with `DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM)`, `android.text.format.DateFormat.getBestDateTimePattern(locale, "MMMd")`, respect the 12/24-hour setting (`DateFormat.is24HourFormat(context)`), and `DateUtils.getRelativeTimeSpanString` ("5 min ago").
- **Numbers and currency:** `NumberFormat.getInstance(locale)`, `NumberFormat.getCurrencyInstance(locale)` with `currency = Currency.getInstance("INR")`, or ICU `android.icu.number.NumberFormatter` (API 30+).
- Store and transmit timestamps in **UTC** (ISO-8601 / epoch), and convert to the user's `ZoneId` only for display.
- Units: use the user's measurement system (`LocaleData` / `MeasureFormat`).

</details>

---

[⬅ Previous: Coding & Scenarios](25-coding-scenarios.md) · [⬅ Back to index](../README.md) · [Next: Company-Wise Questions ➡](27-company-wise-questions.md)
