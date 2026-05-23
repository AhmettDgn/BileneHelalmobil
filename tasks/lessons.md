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
