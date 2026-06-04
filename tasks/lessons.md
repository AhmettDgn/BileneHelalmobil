# Dersler ve Kurallar

Bu dosya, geliştirme sürecinde öğrenilen dersleri ve hata önleme kurallarını tutar.

## Kural 1 — create-expo-app boş dizin gerektirir

`npx create-expo-app@latest .` komutu mevcut dizinde herhangi bir dosya varsa çalışmaz.
Geçici çözüm: dosyaları dışarı taşı, proje oluştur, geri al.

## Kural 2 — Tab navigator yerine Stack kullan

Kahoot tarzı oyunlarda tab bar istenmiyor. Varsayılan şablon tabs kullanıyor.
_layout.tsx'i `<Stack screenOptions={{ headerShown: false }}>` olarak değiştir.

## Kural 3 — NativeWind v4 için babel ve metro config gerekir

Expo SDK 56 ile NativeWind v4 kurulumu için:
- `babel.config.js`: `['babel-preset-expo', { jsxImportSource: 'nativewind' }]` ve `'nativewind/babel'`
- `metro.config.js`: `withNativeWind(config, { input: './src/global.css' })`
- `global.css`: `@tailwind base/components/utilities` direktifleri
- `nativewind-env.d.ts`: `/// <reference types="nativewind/types" />`

## Kural 4 — RPC sözleşmelerini prose rehberden DEĞİL, gerçek web kodundan doğrula

Mobil uygulama `SYSTEM_MOBILE_GUIDE.md` (prose) baz alınarak yazıldığında RPC dönüş
şekilleri yanlış varsayıldı ve "Oyun Bitti!" gibi kritik bug'lar çıktı. Gerçek kaynak:
**web projesi `C:\Users\HP\Desktop\BileneHelal`** (SQL migration'lar + istemci RPC parse'ı).

Kritik kurallar (web ile birebir eşleşmeli):
- **`RETURNS TABLE` → supabase-js DİZİ döndürür.** `data?.[0]` ile oku, asla `data.field` değil.
  Bu kuraldaki RPC'ler: `get_game_session_sync`, `submit_player_answer`, `sync_game_phase`,
  `get_leaderboard_entries`, `get_lobby_participants`.
- **`RETURNS jsonb` → tek obje.** Doğrudan `data.field` oku.
  Bunlar: `join_game_session` (`data.participant`/`data.game_session`), `get_playable_game_state`.
- **`submit_player_answer` 5 parametre ister** — `p_response_time_ms` dahil. Eksik parametre
  PostgREST'te fonksiyon çözümlenememesine yol açar.
- **Host oyun kontrolü RPC DEĞİL.** Web `game_sessions` tablosuna doğrudan `.update()` yapıyor
  (start/end/next/finish). Mobilde de host'un auth'lu client'ıyla aynı UPDATE'ler yapılmalı;
  `start_game_session` gibi RPC'ler veritabanında yok.
- RPC argümanlarında `undefined` yerine `?? null` gönder (örn. `p_display_name`, `p_participant_id`);
  default'u olmayan parametrelerde `undefined` fonksiyon çözümlemesini bozar.

## Kural 5 — Expo/Metro projesinde paket yöneticisini değiştirme (npm kullan)

**Belirti:** `npm` ile çalışan proje, `pnpm install` ile yeniden kurulunca açılışta
boş/yarım ekran (ekran tam gelmiyor).

**Neden:** pnpm'in varsayılan izole/symlink'li `node_modules` düzeni (`node_modules/.pnpm`
store) React Native/Metro modül çözümlemesini bozar. RN ekosistemindeki "phantom"
(bildirilmemiş) bağımlılıklar düz `node_modules` bekler; symlink layout'ta çözülemez →
bundle/runtime hatası.

**Kural:**
- Bu proje **npm** ile yönetilir (`package-lock.json` tek kilit dosyasıdır).
- `pnpm-lock.yaml` oluşturma; oluştuysa sil ve `node_modules`'ı silip `npm install` yap.
- Tanı: `node_modules/.pnpm` klasörü VARSA pnpm ile kurulmuştur (yanlış); üst düzey
  paketler symlink değil gerçek klasör olmalı (`ls node_modules/expo`).
- Mecbur pnpm kullanılacaksa `.npmrc` → `node-linker=hoisted` ŞART.

## Kural 6 — Hermes değişken argümanlı dinamik `import()`'i derleyemez (Supabase OTel)

**Belirti:** `npx expo export` (veya cihazda Hermes) → `error: Invalid expression encountered`,
`hermesc.exe ... exited with non-zero code: 2`. Metro bundle başarılı (1406 modül) ama Hermes
bytecode adımı düşüyor → cihazda boş ekran.

**Neden:** `@supabase/supabase-js` (≥ 2.106.x), isteğe bağlı OpenTelemetry için
`import(OTEL_PKG)` (string literal DEĞİL, değişken) kullanıyor. Metro değişken argümanlı
dinamik import'u dönüştüremez, ham `import()` olarak bundle'a bırakır; Hermes ham `import()`'i
parse edemez.

**Çözüm (uygulandı):** `babel.config.js` içinde, **yalnızca `@supabase` dosyalarına** uygulanan
küçük bir Babel eklentisi string-literal olmayan `import()`'i `Promise.resolve(null)`'a çevirir
(OTel mobilde kullanılmıyor). Doğrulama: `npx expo export --platform android` artık `.hbc`
üretiyor, EXIT 0.

**Kural:** Bir bağımlılık değişken argümanlı dinamik `import()` getirirse Hermes kırılır;
düzeltmeyi salt-okunur testle değil, **`expo export` (Hermes bytecode) ile** doğrula —
sadece `tsc` veya dev bundle yeterli değildir.

## Kural 7 — Patch bump sonrası `babel-preset-expo`'yu açıkça devDependency yap

**Belirti:** `expo install --fix` ile patch'ler hizalandıktan sonra
`Cannot find module 'babel-preset-expo'` (bundle ilk modülde düşer).

**Neden:** `babel-preset-expo` transitif (expo'nun) bağımlılığı; npm sürüm bump'ından sonra
onu top-level yerine `node_modules/expo/node_modules/` altına nest edebilir. `babel.config.js`
preset'i string ile referansladığından `@babel/core` kökten bulamaz.

**Çözüm (uygulandı):** `package.json` → `devDependencies` içine `babel-preset-expo` (expo'nun
istediği aralıkla, `~54.0.11`) eklendi; böylece her zaman top-level'a hoist edilir.

## Kural 8 — Mobil Google/OAuth: PKCE + Supabase Redirect URL whitelist

**Belirti:** Telefonda Google ile giriş, doğrulamadan sonra **localhost'a** dönüyor (oturum
kurulmuyor).

**Neden (iki ayrı katman):**
1. **Dashboard:** Google → Supabase → uygulamaya dönerken Supabase, gönderilen `redirect_to`
   değeri **Authentication → URL Configuration → Redirect URLs** izin listesinde yoksa varsayılan
   **Site URL'ye (web'in `localhost`'u)** geri döner.
2. **Kod:** Supabase varsayılanı **PKCE** akışıdır; dönüşte `?code=...` gelir. Eski kod token'ları
   `?access_token` (query) olarak okuyordu — ama implicit akışta token'lar **fragment**'tedir
   (`#access_token`), PKCE'de ise hiç gelmez. Yani redirect düzelse bile oturum kurulamıyordu.

**Çözüm (uygulandı):**
- `lib/supabase/client.ts` → `auth.flowType: 'pkce'`.
- `features/auth/authService.ts` → `signInWithOAuth({ redirectTo, skipBrowserRedirect:true })`,
  `WebBrowser.openAuthSessionAsync`, dönüş URL'inden query+fragment ayıklayan parser, sonra
  `supabase.auth.exchangeCodeForSession(code)` (implicit yedeği `setSession`). `__DEV__`'de
  `redirectTo` Metro log'una yazılıyor (whitelist'e eklenecek tam değer).

**Ortam farkı (KRİTİK):**
- **Expo Go:** custom scheme deep link ÇALIŞMAZ. `makeRedirectUri` `exp://<IP>:8081/--/auth/callback`
  döndürür; bu değer (IP değiştikçe değişir) veya `exp://**` wildcard Supabase'e eklenmeli.
- **Dev build / standalone:** `bilenehelalmobil://auth/callback` (sabit) döndürür — OAuth için
  önerilen yol. Bu değer Supabase Redirect URLs'e eklenmeli; `app.json` `scheme` ile eşleşir.
- Ayrıca Google Cloud Console'da authorized redirect URI = `https://<ref>.supabase.co/auth/v1/callback`
  olmalı (Google → Supabase hop'u; bu zaten doğru olmalı çünkü akış Google'a ulaşıyor).
