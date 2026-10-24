# DexQuest GO v1.0 — Android companion app (unofficial)

A separately installed Android APK project, adapted from the **DexQuest FireRed** WebView shell/design. **It does not modify or access Pokémon GO**. Your catch/shiny marks and evolution plans are manual, private, and stored on-device.

## Features

1. **Smart Pokédex:** offline National Pokédex species database (1,025 indexed species, Generations 1–9), search, generation/status filters, caught checkbox and persistent progress.
2. **Shiny collection:** independent shiny marks, filter by shiny/missing shiny, and region. Adding a shiny also marks its species caught.
3. **Evolution & Candy planner:** custom goals with source Pokémon, target evolution, needed and owned Candy, remaining Candy, item/quest notes; editable example candy costs for a curated subset. No automatic Pokemon GO account sync.
4. **Storage Cleaner:** builds and copies Pokémon GO inventory queries using documented search keywords. Excludes 3★, 4★, shiny, legendary, mythical, lucky, favorite, shadow, costume and defender by default. **It never initiates a transfer**. Confirm each Pokémon in the game manually.
5. **Backup and restore:** export/import your data via Android's system document picker. Works offline. APK has a unique application ID and does not overwrite DexQuest FireRed.

**Important distinctions:** This is a **National Pokédex species catalog**, not the currently available Pokémon GO roster. Some species/shinies may not be released in GO. Individual duplicates, forms, regional variants and costumes are not separate entries in v1.0. The example Candy amounts aren't live game data; verify item and special conditions in game before evolving. Offline text/checklists work without internet, but optional external sprites need a connection.

## Linux Mint build (same setup as DexQuest FireRed)

Required: Android SDK platform **android-35**, Android Gradle Plugin 8.6.1 (downloaded by Gradle on first build), **Gradle 8.9**, and a full **JDK 21** (or full supported JDK 17) with `jlink` installed. This project uses Gradle 8.9 and the local SDK you already used for FireRed. It compiles with SDK 35, targets 35, and **runs on Android 17 (API 37) without needing to compile with API 37**.

Extract the downloaded ZIP to your Desktop and run:

```bash
cd "$(xdg-user-dir DESKTOP)/DexQuest_GO_Android"
export ANDROID_HOME="$HOME/Android/Sdk"
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH="$JAVA_HOME/bin:$HOME/.local/opt/gradle-8.9/bin:$PATH"
./build-apk.sh
```

If missing `jlink`:

```bash
sudo apt update
sudo apt install openjdk-21-jdk-headless
```

Successful compilation displays **BUILD SUCCESSFUL**. The resulting APK is at:

`app/build/outputs/apk/debug/app-debug.apk`

Connect your Android 17 phone via USB (USB debugging enabled), then:

```bash
adb devices
./install-adb.sh
```

Or install directly:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Package ID: `com.dexquest.go`. This is a **separate app** from the earlier `com.dexquest.firered`. It does not inherit FireRed progress (they are different games), and will not overwrite it.

## Browser preview (optional)

Open `app/src/main/assets/index.html` in your desktop browser, or serve the assets directory locally:

```bash
cd app/src/main/assets
python3 -m http.server 8000
```

Then open `http://localhost:8000`. In browser preview the JSON export downloads normally, while in Android it uses the system file-saving dialog. The page is a bundled offline WebView UI; the Android app requires no server.

## Backups and privacy

- Changes save to WebView `localStorage` under `dexquest.go.v1`.
- Export to JSON in **Backup & settings**, then import it on the next device. Import **replaces** the current GO data (confirmation required).
- FireRed `owned` JSON is intentionally **not** recognized as Pokémon GO catches.
- No tracker data is transmitted to the internet or any game service. Only optional public sprite images are requested from GitHub when online.
- If you uninstall or clear app data before exporting, local data might be lost.
- Clipboard copy/share is handled via Android native APIs (if running in APK).

## Repository layout

```
DexQuest_GO_Android/
├── app/build.gradle                  # API 35, separate application ID
├── app/src/main/AndroidManifest.xml
├── app/src/main/java/com/dexquest/go/MainActivity.java
├── app/src/main/assets/index.html   # Pages, controls, navigation
├── app/src/main/assets/styles.css   # Responsive DexQuest theme
├── app/src/main/assets/app.js       # Search, local save, JSON, Candy goals
├── app/src/main/assets/species.js   # 1,025 National Dex species
├── app/src/main/res/mipmap-*/       # Launcher icons
├── tests/check_project.py
├── build-apk.sh
├── install-adb.sh
└── README.md
```

## Source notes and legal

- Reuses the visual identity and Android build structure of the previously created **DexQuest FireRed** project. Species 1–386 were extracted from its included National Dex list; Generations 4–9 were added in National Dex order.
- National Pokédex reference: <https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/pokemon_species.csv>. PokeAPI is for mainline species data and **does not** provide Pokémon GO evolution Candy prices or current release status.
- Storage syntax (AND `&`, negate `!`, `age0`, `4*`, `shiny`, `legendary`, etc.): <https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/1486-searching-filtering-your-pokemon-inventory/>
- Pokémon and Pokémon GO are trademarks of their respective owners. This is a fan-made project; no official affiliation.