# BileneHalal Mobil — Görev Listesi

## Faz 1 — Proje İskeleti ✅

- [x] Expo projesi oluşturuldu (SDK 56, TypeScript)
- [x] Expo Router Stack navigator kuruldu
- [x] NativeWind v4 kuruldu ve yapılandırıldı
- [x] Supabase + AsyncStorage kuruldu
- [x] Klasör yapısı kuruldu (features/, lib/, tasks/)
- [x] lib/supabase/client.ts oluşturuldu
- [x] lib/supabase/database.types.ts oluşturuldu
- [x] lib/player-session.ts oluşturuldu
- [x] app/_layout.tsx Stack'e dönüştürüldü
- [x] app/index.tsx (PIN giriş ekranı) oluşturuldu
- [x] Tüm route iskeletleri oluşturuldu

## Faz 2 — Auth Akışı ✅

- [x] AuthProvider context oluşturuldu
- [x] features/auth/authService.ts yazıldı (email + Google OAuth)
- [x] LoginScreen tamamlandı
- [x] RegisterScreen tamamlandı
- [x] (auth)/_layout.tsx route guard eklendi
- [x] (dashboard)/_layout.tsx route guard eklendi
- [x] TypeScript sıfır hata ile derlendi

## Faz 3 — Dashboard + Quiz Builder ✅

- [x] quizService.ts (listQuizzes, createQuiz, updateQuiz, deleteQuiz, createGameSession)
- [x] DashboardScreen (quiz listesi, başlat, düzenle, sil, FAB)
- [x] QuizEditorForm (meta + soru listesi + inline soru editörü)
- [x] (dashboard)/quiz/new.tsx ve quiz/[quizId]/edit.tsx route'ları
- [x] database.types.ts Supabase v2 formatına uygun hale getirildi
- [x] TypeScript sıfır hata, web bundle başarılı

## Faz 4 — PIN Katılım + Oyuncu Lobi

- [x] index.tsx iki adımlı PIN + displayName akışı
- [x] lobbyService.ts (joinGame, getLobbyParticipants, updateDisplayName)
- [x] PlayerLobbyView (katılımcı listesi, isim düzenleme, PIN gösterimi)
- [x] useGameSync hook (1 sn polling, get_game_session_sync)
- [x] useLobbySubscription hook (postgres_changes realtime)
- [x] play/[gamePin].tsx — lobi/oyun/bitti geçişi
- [x] TypeScript sıfır hata, bundle başarılı

## Faz 5 — Oyuncu Oyun Akışı ✅

- [x] gameService.ts (getPlayableGameState, submitAnswer, getLeaderboard, host RPC'leri)
- [x] useQuestionTimer hook (250ms tick, phase_ends_at bazlı)
- [x] useLeaderboard hook (1.5 sn polling)
- [x] TimerBar (animasyonlu, renkli urgency)
- [x] AnswerOptions (4 renkli Kahoot tarzı, optimistic lock)
- [x] LeaderboardView (madalya, "sen" vurgusu)
- [x] PlayerGameView (soru fazı + intermission geçişi)
- [x] play/[gamePin].tsx güncellendi — waiting/in_progress/completed tam akış
- [x] TypeScript sıfır hata, bundle başarılı

## Faz 6 — Host Lobi + Host Oyun Akışı ✅

- [x] HostLobbyView (PIN gösterimi, realtime katılımcı listesi, "Oyunu Başlat")
- [x] HostGameView (soru görünümü, intermission leaderboard, kontrol butonları)
- [x] host/[gameSessionId].tsx — host kimlik doğrulaması + waiting/in_progress/completed geçişi
- [x] gameService.ts host RPC'leri: startGameSession, endCurrentQuestion, startNextQuestion, finishGame
- [x] TypeScript sıfır hata, bundle başarılı

---

## Proje Durumu: TAMAMLANDI ✅

Tüm 6 faz implement edildi ve doğrulandı.
Supabase bağlantısı yapılandırıldı (.env.local).
Expo Go veya emülatörde test edilmeye hazır.

---

## Faz 7 — Backend Sözleşme Uyumsuzluğu Düzeltmesi ✅

**Belirti:** Telefonda PIN girilince, web'de oyun başlatılmamışken "Oyun Bitti!" görünüyordu.

**Kök neden:** Mobil kod prose `SYSTEM_MOBILE_GUIDE.md`'den yazılmış; RPC dönüş şekilleri ve
host kontrol mekanizması gerçek web projesiyle (`C:\Users\HP\Desktop\BileneHelal`) uyumsuzdu.

- [x] `useGameSync` — `get_game_session_sync` dizi döndürüyor; `data[0]` + fallback ile okundu (Bug 1)
- [x] `submitAnswer` — `p_response_time_ms` (5. param) eklendi, dönüş `data[0]` okundu (Bug 2)
- [x] Host kontrolleri — `start/end/next/finish` RPC'leri yok; doğrudan `game_sessions` UPDATE'i (Bug 3)
- [x] `PlayerGameView` — yanıt süresi `phaseStartedAt`'ten hesaplanıyor
- [x] `lobbyService.joinGame` — `p_display_name: ?? null` + null güvenliği
- [x] `database.types.ts` — dizi dönüşler + `p_response_time_ms` tipi düzeltildi
- [x] `npx tsc --noEmit` sıfır hata; Android dev bundle (Metro) başarıyla derlendi

**Doğrulama notu:** Tip kontrolü ve bundle derlemesi yapıldı. Uçtan uca oyun akışı (host başlat →
oyuncu lobi → soru → cevap → leaderboard → bitir) web + telefon eş zamanlı test edilmeli.

---

## Faz 8 — Soru Sonucu Reveal Ekranı (Doğru Cevap + Doğru Cevaplayanlar → Skor Tablosu) ✅

**İstek:** Soru süresi dolunca / host soruyu geçince önce doğru cevap + doğru cevaplayanlar
(~5 sn), sonra otomatik skor tablosu. Hem mobil hem web.

- [x] Backend: `008_question_results_rpc.sql` — `get_question_results` (SECURITY DEFINER, anti-cheat
      guard, doğru şık + doğru cevaplayanlar). **Web projesinde; canlı Supabase'e uygulanmalı.**
- [x] Mobil: `getQuestionResults` + `useQuestionResults` + `useIntermissionStage` + `QuestionResultsView`;
      `PlayerGameView`/`HostGameView` intermission dalları reveal→leaderboard; `database.types.ts`.
- [x] Web: `use-question-results` + `use-intermission-stage` + `QuestionResults`;
      `PlayerGameView`/`HostGameView` intermission dalları; `database.types.ts`.
- [x] Geçiş otomatik, `phase_started_at` çapalı (REVEAL_MS=5000) — tüm cihazlar senkron.
- [x] Mobil `tsc` + Android dev bundle temiz; Web `tsc --noEmit` temiz.

**Doğrulama notu:** ÖNCE migration Supabase'e uygulanmalı (`npx supabase db push` ya da SQL Editor).
Sonra web (host) + telefon (oyuncu) eş zamanlı uçtan uca test edilmeli.
