# DexQuest — FireRed National Pokédex Tracker

An **unofficial fan-made**, open-source Android + HTML Pokédex companion for Pokémon FireRed / LeafGreen and compatible Generation III games. Track all **386 National Dex Pokémon**.

## Features

- National Pokédex #001–#386; Kanto, Johto and Hoenn filters
- Collected / missing checklist, species guides and evolution notes
- Offline-first personal progress saved locally on-device
- JSON backup export and import
- Optional online artwork and encounter lookups via PokéAPI
- Android Back navigation and native Android document pickers
- No ads, analytics, account sign-in or Google Play Services required

## Build (Android Studio / Linux Mint)

Requires JDK 17, Android SDK platform 35, and Gradle 8.9.

    gradle :app:assembleDebug --no-daemon

Debug output: app/build/outputs/apk/debug/app-debug.apk

Install on a connected Android device:

    adb install -r app/build/outputs/apk/debug/app-debug.apk

Or open **Actions → Build Android APK → Artifacts** and download the debug build. This reconstructed Android wrapper has not yet been compiled or device-tested here. Use a stable private release signing key for production; never commit secrets.

Application ID: dev.cihan.dexquest.firered — minSdk 26 (Android 8), targetSdk 35.

## Source and privacy

The bundled HTML is based on the earlier DexQuest prototype, with personal collection progress removed. The public app starts with an **empty checklist**. No ROMs or game saves are included. Progress is stored in WebView local storage and exportable as JSON.

## F-Droid and Huawei AppGallery

This repository is a *candidate for submission*, not an accepted app. Check Android builds and device behavior before distribution. Review the artwork licensing and branding issues documented in THIRD_PARTY_NOTICES.md; Apache-2.0 applies only to original first-party source code, **not Pokémon character names, artwork or trademarks**. External artwork references remain in the HTML and need legal review before store submission.

F-Droid inclusion policy: https://f-droid.org/docs/Inclusion_Policy/

## License / disclaimer

Code: Apache License 2.0 (see LICENSE).

Pokémon © Nintendo / Creatures / GAME FREAK. Not affiliated with or endorsed by Nintendo, The Pokémon Company, Creatures or GAME FREAK. Names are used solely to describe game compatibility.

Repository: https://github.com/cihan-ux/Pokemon-Fire-Red-Pokedex-for-Android
