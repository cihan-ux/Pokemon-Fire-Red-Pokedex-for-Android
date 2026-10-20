# DexQuest Complete Pokédex (Android)

A separate, unofficial companion app extending the existing [DexQuest FireRed](../README.md) idea to the National Pokédex through Generation IX.

## Features (v1)

- National Dex #0001–#1025, Gen 1–9 generation selector
- Search by number or species name, caught/missing/favorite filters
- Locally persisted caught checklist and favorites
- Artwork from the PokéAPI sprites project
- Detailed types, base stats, abilities, height and weight fetched on demand
- Google Play Services not required
- Dark, responsive Android WebView app
- Species list cached after a successful load, but images and species details require connectivity unless cached by Android/WebView

**Scope:** This version covers the 1,025 National Dex entries through Generation IX. It does not yet include alternate forms, Mega Evolutions, Gigantamax, regional forms, or future generations. Not all data is available fully offline.

## Build

Requires Java 17, Android SDK 35 and Gradle 8.9, with Android Gradle Plugin 8.7.3.

```bash
cd complete-pokedex
gradle :app:assembleDebug --no-daemon
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

APK can be downloaded from the GitHub Actions workflow artifact after a successful build. Debug builds are not production signed.

## Data, privacy & copyright

Species metadata: [PokéAPI](https://pokeapi.co/) (remote); images: [PokeAPI/sprites](https://github.com/PokeAPI/sprites). Review third-party licensing and trademark use before publishing to an app store.

Progress is stored only in WebView localStorage. The application does not collect analytics or login credentials. No ROM or copyrighted game files are distributed. Code is published under the root project's Apache-2.0 license. Pokémon and related names are trademarks of their owners; no endorsement is claimed.
