# DexQuest GO v1.0 — Android 17

Daha önce çalıştırdığımız **DexQuest FireRed** uygulamasının Android/WebView yapısını yeniden kullanarak geliştirilmiş, **ayrı kurulan** Pokémon GO yardımcısı.

**Özellikler:** 1.025 türlük (9 nesil) National Pokédex ve yakalandı işaretleri; ayrı Shiny koleksiyonu; elle düzenlenen Candy/evolution hedefleri; Pokémon GO deposunda kullanabileceğin güvenli arama metinleri; cihaz içinde otomatik kayıt; Android sistem dosya seçicisiyle JSON yedek ve geri yükleme.

**Uyarı:** Tüm 1.025 türün Pokémon GO'da açıldığı veya Shiny çıktığı anlamına gelmez. Örnek Candy maliyetleri düzenlenebilir; oyundan kontrol et. Arama filtresi sadece adayları gösterir, Pokémon aktarıp silmez. FireRed kayıtların Pokémon GO'ya otomatik taşınmaz.

## Kurulum: Linux Mint

ZIP dosyasını Masaüstüne aç ve terminalde sırayla çalıştır:

```bash
cd "$(xdg-user-dir DESKTOP)/DexQuest_GO_Android"
export ANDROID_HOME="$HOME/Android/Sdk"
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH="$JAVA_HOME/bin:$HOME/.local/opt/gradle-8.9/bin:$PATH"
./build-apk.sh
```

Önceki JDK `jlink` hatasını tekrar görürsen:

```bash
sudo apt install openjdk-21-jdk-headless
```

`BUILD SUCCESSFUL` yazdığında, Android 17 telefonu USB ile bağla (USB hata ayıklama açık) ve:

```bash
adb devices
./install-adb.sh
```

Oluşan APK: `app/build/outputs/apk/debug/app-debug.apk`.

**Önemli:** Bu ZIP'in içinde derlenmiş APK yok, Android kaynak projesi var. APK'yı bilgisayarındaki SDK ve Gradle oluşturuyor. DexQuest FireRed uygulaman silinmez (`com.dexquest.go` ayrı paket).

Uygulamada **Backup & settings** ekranından düzenli JSON yedeği al; cihazın uygulama verisini silersen işaretlemeler kaybolabilir. Uygulama internet olmadan çalışır, yalnızca Pokémon görselleri internet kullanır.

Detaylı İngilizce açıklama: `README.md`.