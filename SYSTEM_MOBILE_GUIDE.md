# BileneHalal Sistem ve Mobil Geçiş Rehberi

## 1. Amaç

Bu doküman, mevcut BileneHalal web uygulamasını uçtan uca anlamak ve aynı sistemi `Expo / React Native` ile mobil uygulamaya taşımak için teknik bir referans sağlamak amacıyla hazırlandı.

Odak noktası yalnızca ekranları listelemek değil; şu katmanların birbirine nasıl bağlandığını netleştirmektir:

- `Next.js App Router` route yapısı
- `Supabase Auth + Postgres + RPC` backend modeli
- quiz üretim akışı
- host ve oyuncu oyun akışı
- lobi ve skor senkronizasyonu
- mobilde yeniden kullanılabilecek ve yeniden yazılması gereken parçalar

## 2. Teknik Özet

Proje şu ana teknoloji omurgasına sahip:

- `Next.js 14.2.x` App Router
- `React 18`
- `TypeScript`
- `Supabase`
  - Auth
  - Postgres
  - Realtime
  - RPC fonksiyonları
- `Tailwind CSS`
- `next-themes`
- `shadcn/ui` tarzı ortak UI bileşenleri
- feature-based klasörleme

Kritik mimari karar:

- Görsel arayüz `app/`, `features/` ve `components/` altında.
- Yetki, veri doğrulama ve oyun akışının kritik bölümü doğrudan istemcide değil, `Supabase RPC` ve veritabanı state’i üzerinden yönetiliyor.
- Oyun fazı, soru geçişi ve cevap kabulü büyük ölçüde `game_sessions` tablosundaki alanlar ve RPC’ler üzerinden ilerliyor.

## 3. Dizin ve Sorumluluk Haritası

### `app/`

Next.js route katmanı.

- `app/layout.tsx`: tüm uygulamanın root layout’u, navbar, theme provider, başlangıç auth bilgisi.
- `app/page.tsx`: landing page ve hızlı PIN ile katılım girişi.
- `app/(auth)/*`: login/register route group’ları.
- `app/(dashboard)/*`: korumalı host/dashboard alanı.
- `app/(game)/host/[gameSessionId]/page.tsx`: host paneli.
- `app/(game)/play/[gamePin]/page.tsx`: oyuncu tarafı giriş noktası.
- `app/auth/callback/route.ts`: OAuth callback route’u.

### `features/`

İş mantığı feature bazlı ayrılmış durumda.

- `features/auth`
  - giriş, kayıt, OAuth, navbar auth durumu
- `features/quiz-builder`
  - quiz oluşturma ve güncelleme
- `features/game-lobby`
  - PIN ile katılım, host lobi, oyuncu lobi, katılımcı listesi
- `features/quiz-engine`
  - aktif oyun akışı, soru gösterimi, cevap gönderimi, host soru kontrolü
- `features/stats`
  - leaderboard ve zaman senkronizasyonuna ait hook/bileşenler

### `lib/`

Ortak servis ve yardımcı katman.

- `lib/supabase/server.ts`: server-side Supabase client
- `lib/supabase/client.ts`: browser-side Supabase client
- `lib/supabase/database.types.ts`: tablo/RPC tipleri için ana TypeScript sözleşmesi
- `lib/player-session.ts`: anonim oyuncu session bilgisini `sessionStorage` içinde tutar
- `lib/utils.ts`: `cn`, `formatTime`, `generatePin`
- `lib/redis/client.ts`: Upstash Redis istemcisi, şu an ana akışta aktif kullanılmıyor

### `components/`

Paylaşılan UI katmanı.

- `components/ui/*`: button, input, card, label, badge, theme toggle
- `components/providers/ThemeProvider.tsx`: theme provider

### `supabase/`

Backend tanımı ve SQL odaklı iş mantığı burada.

- `supabase/migrations/*.sql`: şema ve RPC fonksiyonları
- `supabase/functions/timer/index.ts`: edge function tabanlı timer denemesi/hazırlığı

## 4. Route Haritası

Kullanıcıların gördüğü ana route’lar:

| Route | Amaç | Kim kullanır |
| --- | --- | --- |
| `/` | landing page + PIN ile katılım | herkes |
| `/login` | email/password login | host |
| `/register` | kayıt | host |
| `/dashboard` | quiz listesi ve yönetim | giriş yapmış host |
| `/quiz/new` | yeni quiz oluşturma | giriş yapmış host |
| `/quiz/[quizId]/edit` | quiz düzenleme | quiz sahibi host |
| `/host/[gameSessionId]` | canlı host paneli | oturumun host’u |
| `/play/[gamePin]` | oyuncu lobi / oyun ekranı | oyuncu |
| `/auth/callback` | OAuth dönüşü | sistem route’u |

Route group davranışları:

- `app/(auth)/layout.tsx`: giriş yapmış kullanıcıyı `/dashboard`’a yönlendirir.
- `app/(dashboard)/layout.tsx`: giriş yapmamış kullanıcıyı `/login`’e yönlendirir.

## 5. Uçtan Uca Ürün Akışları

### 5.1 Host auth akışı

1. Kullanıcı `/login` veya `/register` ekranına gelir.
2. Formlar `features/auth/components/*` ile render edilir.
3. Email auth için `features/auth/actions.ts` içindeki server action’lar çağrılır.
4. OAuth için `GoogleSignInButton` doğrudan browser Supabase client ile redirect başlatır.
5. Callback `app/auth/callback/route.ts` içinde session exchange yapar.
6. Başarılı durumda kullanıcı `/dashboard`’a gider.

Veri akışı:

`UI form -> auth action / browser OAuth -> Supabase Auth -> session cookie -> route guard / navbar güncellemesi`

### 5.2 Quiz oluşturma akışı

1. Host `/quiz/new` ekranını açar.
2. `QuizBuilderForm` içinde quiz başlığı, açıklama, yayın durumu ve sorular hazırlanır.
3. Form submit olduğunda `createQuiz()` çağrılır.
4. Önce `quizzes` tablosuna kayıt atılır.
5. Sonra soru listesi `questions` tablosuna toplu insert edilir.
6. Başarılı durumda `/dashboard`’a dönülür.

Veri akışı:

`QuizBuilderForm -> createQuiz() -> quizzes insert -> questions insert -> revalidatePath('/dashboard') -> UI refresh`

### 5.3 Quiz düzenleme akışı

1. Host `/quiz/[quizId]/edit` sayfasını açar.
2. Server component quiz ve soru listesini yükler.
3. `EditQuizPageClient` güncelleme submit’ini yapar.
4. `updateQuizDefinition()` önce sahipliği doğrular.
5. Bekleyen veya aktif bir `game_session` varsa düzenlemeyi engeller.
6. Quiz meta güncellenir, eski sorular silinir, yeni soru listesi tekrar insert edilir.

Veri akışı:

`Edit form -> updateQuizDefinition() -> quiz ownership check -> active session check -> questions delete/reinsert -> dashboard refresh`

### 5.4 Host oyun başlatma akışı

1. Host dashboard’daki quiz kartında `Oyun Baslat` tıklar.
2. `createGameSession(quizId)` çağrılır.
3. Quiz sahipliği ve soru sayısı doğrulanır.
4. `game_sessions` kaydı `waiting` durumunda oluşturulur.
5. Host `/host/[gameSessionId]` route’una yönlendirilir.
6. Host lobi ekranında `Oyunu Baslat` ile `startGameSession(gameSessionId)` çağırır.
7. İlk soru bulunur, süre hesaplanır, `game_sessions` `in_progress` durumuna çekilir.

Veri akışı:

`Dashboard button -> createGameSession() -> game_sessions insert -> host route -> startGameSession() -> first question + phase timestamps -> host UI`

### 5.5 Oyuncu PIN ile katılım akışı

1. Oyuncu ana sayfada PIN girer.
2. Auth’suzsa görünen ad da girer, auth’luysa profil adı kullanılır.
3. `joinGameSession(gamePin, displayName?)` çağrılır.
4. Bu action, Supabase RPC `join_game_session` fonksiyonunu çağırır.
5. RPC uygun `game_session` bulur ve `participants` kaydı üretir.
6. Dönen `participant.id` ve `game_session.id`, `sessionStorage` içine yazılır.
7. Oyuncu `/play/[gamePin]` ekranına gider.

Veri akışı:

`Join form -> joinGameSession() -> RPC join_game_session -> participants insert -> player-session write -> /play/[gamePin]`

### 5.6 Oyuncu lobi -> oyun geçişi

1. `PlayerLobbyView`, `sessionStorage` içinden `PlayerSession` okur.
2. `useGameSync()` her saniye oyun durumunu sorgular.
3. `useLobbySubscription()` katılımcı listesini RPC ile yükler ve `postgres_changes` ile yeniler.
4. `gameStatus` değeri `waiting` iken lobi görünür.
5. `gameStatus` `in_progress` veya `completed` olunca `PlayerGameView` render edilir.

Bu önemli bir davranış:

- Oyuncu tarafında ayrı bir “lobi route” ve “oyun route” yok.
- Aynı route (`/play/[gamePin]`) runtime state’e göre görünüm değiştiriyor.

### 5.7 Cevap gönderme ve skor güncelleme akışı

1. `PlayerGameView`, RPC `get_playable_game_state` ile soru setini ve oyuncunun önceki cevaplarını alır.
2. Aktif soru `useGameSync()` üzerinden takip edilir.
3. Oyuncu bir seçeneğe basınca `submitAnswer()` çağrılır.
4. Bu action, RPC `submit_player_answer` fonksiyonunu çağırır.
5. RPC şu kontrolleri yapar:
   - oturum var mı
   - oyuncu yetkili mi
   - oyun aktif mi
   - doğru fazda mı
   - süre doldu mu
   - cevap aktif soruya mı ait
   - aynı soru daha önce cevaplandı mı
6. Başarılıysa `answers` tablosuna insert olur.
7. Aynı transaction akışı içinde `scores` tablosu upsert/mutate edilir.
8. UI cevabı “kilitlenmiş” state’e geçirir.

Veri akışı:

`QuestionDisplay -> submitAnswer() -> RPC submit_player_answer -> answers insert -> scores upsert -> locked answer UI`

### 5.8 Host soru akışı

Host paneli `HostGameView` ile çalışır.

- `useGameSync()` ile mevcut soru ve faz bilgisi takip edilir.
- `useQuestionTimer()` ile kalan süre gösterilir.
- Host butonu bağlama göre üç davranıştan birini yapar:
  - `endCurrentQuestion()`
  - `startNextQuestion()`
  - `finishGame()`

Faz mantığı:

- `question`: cevap kabul edilen aktif soru fazı
- `intermission`: soru arası / leaderboard fazı

### 5.9 Leaderboard akışı

Hem host hem oyuncu tarafı `useLeaderboard()` kullanır.

- Hook her `1.5 saniye`de bir `get_leaderboard_entries` RPC’sini çağırır.
- Dönüşte ilk 5 oyuncu `Leaderboard` bileşeninde gösterilir.

Veri akışı:

`Leaderboard hook -> RPC get_leaderboard_entries -> scores + participants join -> UI ranking`

## 6. Backend Veri Modeli

Ana tablolar:

### `quizzes`

Quiz ana kaydı.

- `id`
- `owner_id`
- `title`
- `description`
- `is_published`
- `duration_seconds` (şu an merkezi oyun akışında kritik kullanılmıyor)

### `questions`

Quiz soruları.

- `quiz_id`
- `order`
- `text`
- `options: string[]`
- `correct_option_index`
- `time_limit_seconds`
- `points`

Bir quiz çok sayıda soru içerir.

### `game_sessions`

Canlı oyun oturumunun state tablosu.

Kritik alanlar:

- `quiz_id`
- `host_id`
- `game_pin`
- `status`: `waiting | in_progress | completed`
- `current_question_index`
- `current_phase`: `question | intermission`
- `active_question_id`
- `started_at`
- `phase_started_at`
- `phase_ends_at`
- `ended_at`
- `total_questions`

Bu tablo mobil uygulama için de canlı oyun state’inin ana kaynağıdır.

### `participants`

Lobiye/oyuna katılan oyuncular.

- `game_session_id`
- `user_id` nullable
- `display_name`
- `is_online`
- `last_seen`

Not:

- `user_id = null` ise anonim oyuncu olabilir.
- Aynı oturumda `display_name` benzersizdir.

### `answers`

Oyuncu cevapları.

- `game_session_id`
- `participant_id`
- `question_id`
- `selected_option_index`
- `is_correct`
- `response_time_ms`
- `points_earned`

`participant_id + question_id` benzersizdir, yani bir oyuncu bir soruya tek kez cevap verebilir.

### `scores`

Toplam skor tablosu.

- `game_session_id`
- `participant_id`
- `total_score`
- `correct_answers`
- `total_questions_answered`
- `updated_at`

Leaderboard bu tablo üzerinden üretilir.

## 7. RPC ve Veritabanı Fonksiyon Katmanı

Mobil uygulama geliştirirken en önemli backend sözleşmesi bu fonksiyonlardır.

### `join_game_session(p_game_pin, p_display_name)`

Amaç:

- PIN ile oyuna katılım
- auth kullanıcı için gerekirse profil adını kullanma
- `participants` kaydı oluşturma

Dönüş:

- `participant`
- `game_session`

### `update_participant_name(p_participant_id, p_display_name)`

Amaç:

- anonim oyuncunun görünen adını değiştirebilmesi
- aynı oyun içinde isim benzersizliğini koruma

### `get_lobby_participants(p_game_session_id)`

Amaç:

- host ve oyuncu için güvenli katılımcı snapshot’ı dönmek

Dönüş:

- `participants` kayıt kümesi

### `sync_game_phase(p_game_session_id, p_participant_id?)`

Amaç:

- oyun state’ini faz bazında normalize etmek
- gerekirse soru süresi dolunca `question -> intermission` geçişini DB seviyesinde yapmak

Bu fonksiyon kritik çünkü faz doğruluğu UI’dan bağımsız tutuluyor.

### `get_game_session_sync(p_game_session_id, p_participant_id?)`

Amaç:

- istemcinin polling ile okuyacağı hafif senkronizasyon snapshot’ı

Dönüş alanları:

- `current_question_index`
- `game_status`
- `current_phase`
- `active_question_id`
- `phase_started_at`
- `phase_ends_at`
- `total_questions`
- `has_next_question`

### `get_playable_game_state(p_game_session_id, p_participant_id?)`

Amaç:

- oyuncu ekranı için oynanabilir soru setini ve kendi cevap özetlerini dönmek

Dönüş:

- `quiz_title`
- `active_question_id`
- `questions[]`
- `participant_answers[]`

### `submit_player_answer(...)`

Amaç:

- tekil cevap kabulü
- aktif soru kontrolü
- faz ve süre doğrulaması
- skor güncellemesi

Dönüş:

- `accepted`
- `already_answered`
- `locked_option_index`
- `points_earned`

### `get_leaderboard_entries(p_game_session_id, p_participant_id?, p_limit?)`

Amaç:

- leaderboard üretmek

Dönüş:

- `participant_id`
- `display_name`
- `total_score`
- `correct_answers`

## 8. Auth ve Session Modeli

### Host tarafı

Host tarafı normal Supabase auth ile çalışıyor.

- email/password login
- email/password signup
- Google OAuth

Kod seviyesinde not:

- `features/auth/actions.ts` içinde `github` desteği tanımlı olsa da mevcut UI’da aktif olarak görünen OAuth butonu `Google` butonudur.

### Route guard modeli

- auth route group: kullanıcı giriş yaptıysa auth ekranlarına dönmez
- dashboard route group: kullanıcı giriş yapmadıysa korumalı alanlara gidemez
- host sayfası ayrıca `host_id === current user` doğrulaması yapar

### Oyuncu session modeli

Oyuncu tarafı için kritik yapı:

```ts
interface PlayerSession {
  participantId: string;
  gameSessionId: string;
  displayName: string;
  isAuthenticated: boolean;
}
```

Bu bilgi `sessionStorage` içinde `bilenehalal:player-session:<gamePin>` anahtarıyla tutulur.

Amaç:

- sayfa yenilenince oyuncu aynı participant kaydına bağlı kalabilsin
- `/play/[gamePin]` ekranı tekrar açıldığında kimlik kaybolmasın

Mobilde bu yapı doğrudan yeniden tasarlanmalıdır.

## 9. Gerçek Zamanlılık ve Oyun State Senkronizasyonu

Mevcut sistem tam anlamıyla tek bir realtime strateji kullanmıyor; hibrit bir model var.

### Aktif kullanılan model

#### Lobi katılımcıları

- İlk yükleme: `get_lobby_participants`
- Canlı güncelleme: Supabase `postgres_changes` subscription

#### Oyun state’i

- `useGameSync()` ile her `1 saniye` polling
- veri kaynağı: `get_game_session_sync`

#### Leaderboard

- `useLeaderboard()` ile her `1.5 saniye` polling
- veri kaynağı: `get_leaderboard_entries`

#### Kalan süre

- `phase_ends_at` timestamp’inden istemci tarafında hesaplanıyor
- `useQuestionTimer()` 250 ms aralıkla yerel geri sayım yapıyor

### Önemli gerçek

Oyun zamanlayıcısı şu an ana akışta broadcast tabanlı değil, büyük ölçüde:

- DB’deki `phase_ends_at`
- istemci polling’i
- istemcide kalan süre hesabı

üzerinden yürüyor.

### Mevcut ama ana akışta aktif olmayan parçalar

#### `features/stats/hooks/use-timer-sync.ts`

- broadcast tabanlı sunucu-otoriteli timer yaklaşımı içeriyor
- ana host/player akışında kullanılmıyor

#### `supabase/functions/timer/index.ts`

- edge function ile timer tick broadcast etme denemesi içeriyor
- mevcut route/hook akışına bağlı görünmüyor

#### `lib/redis/client.ts`

- Upstash Redis istemcisi var
- mevcut quiz/lobi/oyun akışında referanslanmıyor

Bu üç parça dokümante edilmeli ama üretimde aktifmiş gibi ele alınmamalı.

## 10. Mobil Uygulama İçin Ekran ve Sistem Eşlemesi

Hedef yön: `Expo / React Native`

### 10.1 Auth screens

Web karşılığı:

- `/login`
- `/register`
- `/auth/callback`

Mobil karşılığı:

- `LoginScreen`
- `RegisterScreen`
- `OAuthRedirectHandler`

Mobil notu:

- Supabase Auth doğrudan kullanılabilir.
- Ancak Next.js route redirect mantığı yerine mobil navigation flow kurulmalıdır.

### 10.2 Quiz list / dashboard

Web karşılığı:

- `/dashboard`

Mobil karşılığı:

- `DashboardScreen`
- `QuizCard`
- `StartGameAction`

Bu ekranın sorumlulukları:

- kullanıcının quizlerini listelemek
- yeni quiz oluşturma
- mevcut quizi düzenlemeye gitme
- canlı oyun oturumu başlatma

### 10.3 Quiz editor

Web karşılığı:

- `/quiz/new`
- `/quiz/[quizId]/edit`

Mobil karşılığı:

- `QuizEditorScreen`
- `QuestionListPanel` yerine mobil liste
- `QuestionContentEditor` yerine adım adım veya tab yapısı
- `QuestionSettingsScreen` veya bottom sheet

Mobil notu:

- Web’de üç kolonlu editör var.
- Mobilde aynı bilgi yoğunluğu tek ekrana sığmayacağı için çok adımlı veya sekmeli bir düzen gerekir.

### 10.4 Join by PIN

Web karşılığı:

- landing page içindeki `HomeJoinPanel`

Mobil karşılığı:

- `JoinByPinScreen`

Sorumluluklar:

- PIN girişi
- gerekiyorsa görünen ad girişi
- `join_game_session` RPC çağrısı
- `PlayerSession` kalıcılığı

### 10.5 Lobby

Web karşılığı:

- `HostLobbyView`
- `PlayerLobbyView`

Mobil karşılığı:

- `HostLobbyScreen`
- `PlayerLobbyScreen`

Sorumluluklar:

- canlı katılımcı listesi
- PIN gösterimi
- host için oyunu başlatma
- oyuncu için isim düzenleme

### 10.6 Player game screen

Web karşılığı:

- `PlayerGameView`
- `QuestionDisplay`

Mobil karşılığı:

- `PlayerGameScreen`
- `QuestionCard`
- `AnswerOptionsList`
- `PlayerStatusPanel`

Sorumluluklar:

- aktif soruyu göstermek
- timer göstermek
- cevabı kilitlemek
- intermission ve final leaderboard göstermek

### 10.7 Host control screen

Web karşılığı:

- `HostGameView`

Mobil karşılığı:

- `HostGameScreen`

Sorumluluklar:

- aktif soru görünümü
- soru bitirme
- sonraki soruya geçme
- oyunu tamamlama
- leaderboard izleme

### 10.8 Session persistence

Web karşılığı:

- `sessionStorage` tabanlı `player-session`

Mobil karşılığı:

- `expo-secure-store` veya `AsyncStorage`

Öneri:

- anonim oyuncu oturumunu `gamePin` bazlı sakla
- `participantId` ve `gameSessionId` uygulama yeniden açıldığında geri yüklenebilsin

## 11. Mobilde Yeniden Kullanılabilecek ve Yeniden Yazılacak Parçalar

### Doğrudan yeniden kullanılabilecekler

- Supabase backend şeması
- tablo modeli
- RPC sözleşmeleri
- auth mantığının büyük kısmı
- oyun state alanları
- leaderboard mantığı
- soru/cevap veri şekilleri

### Uyarlanarak kullanılabilecekler

- `useGameSync`, `useLeaderboard`, `useQuestionTimer` mantığı
- oyuncu session shape’i
- host/player ekran state ayrımı

### Yeniden yazılması gerekenler

- `server actions`
- `next/navigation`
- `route groups`
- `sessionStorage`
- DOM odaklı UI bileşenleri
- web’e özel layout ve responsive panel yapıları

## 12. Mobil İçin Önerilen Katmanlı Mimari

Expo tarafında önerilen yapı:

### UI katmanı

- screens
- reusable components
- navigation stacks / tabs

### Application katmanı

- `authService`
- `quizService`
- `lobbyService`
- `gameService`
- `leaderboardService`

### Data katmanı

- Supabase client wrapper
- RPC çağrıları
- local persistence adapter

### State katmanı

- `React Query` veya benzeri bir veri cache katmanı önerilir
- polling ve subscription yönetimi hook seviyesinde toplanabilir

## 13. Mobil Implementasyonunda Bağımlı Kalınacak Public Sözleşmeler

Mobil uygulamanın bağımlı olacağı ana sözleşmeler:

- Supabase auth session
- `quizzes`, `questions`, `game_sessions`, `participants`, `answers`, `scores` tablo alanları
- aşağıdaki RPC giriş/çıkışları:
  - `join_game_session`
  - `update_participant_name`
  - `get_lobby_participants`
  - `sync_game_phase`
  - `get_game_session_sync`
  - `get_playable_game_state`
  - `submit_player_answer`
  - `get_leaderboard_entries`
- `PlayerSession` shape’i
- host/player game sync state alanları:
  - `currentQuestionIndex`
  - `gameStatus`
  - `currentPhase`
  - `activeQuestionId`
  - `phaseStartedAt`
  - `phaseEndsAt`
  - `totalQuestions`
  - `hasNextQuestion`

## 14. Bilinen Teknik Gözlemler ve Dikkat Noktaları

1. Oyun motorunun kritik doğrulaması istemcide değil, RPC tarafında. Bu iyi bir şey; mobil taşımada backend’i yeniden icat etmeye gerek yok.
2. Aktif oyun state’i ağırlıklı olarak polling ile yürüdüğü için mobilde pil/ağ etkisi düşünülmeli.
3. Oyuncu tarafı route’u tek; lobi ve oyun görünümü runtime state ile ayrılıyor.
4. `useTimerSync`, edge timer function ve Redis istemcisi geleceğe dönük altyapı gibi duruyor; ana akışın parçası değiller.
5. `quiz` düzenleme akışı aktif/bekleyen oyun varsa bilinçli olarak bloklanıyor.
6. Auth action kodunda `github` provider desteği tanımlı olsa da mevcut UI’da görünür entegrasyon Google odaklı.

## 15. Mobil Tarafa Geçerken Kısa Uygulama Stratejisi

Önerilen sıra:

1. Supabase sözleşmelerini aynen koru.
2. Önce auth + dashboard + join by PIN akışını taşı.
3. Sonra player lobby ve host lobby ekranlarını kur.
4. Ardından `useGameSync` ve `submit_player_answer` merkezli player game akışını taşı.
5. En son host control ve leaderboard polish katmanını tamamla.
6. İhtiyaç varsa polling bazı alanlarda realtime subscription veya server-driven timer ile iyileştirilebilir.

## 16. Sonuç

Bu proje görsel olarak bir Next.js uygulaması olsa da işin asıl çekirdeği web UI’da değil, Supabase tabanlı oyun state modelinde bulunuyor.

Mobil uygulama geliştirirken ana hedef:

- web bileşenlerini birebir taşımak değil,
- mevcut backend sözleşmelerini ve oyun state mantığını koruyarak,
- bunları mobil ekranlar ve mobil persistence/navigation yapısına uyarlamak olmalıdır.

Bu nedenle mobil uygulamanın en güvenli teknik omurgası şudur:

- aynı Supabase backend
- aynı tablo yapıları
- aynı RPC fonksiyonları
- yeni mobil UI katmanı
- yeni mobil navigation ve local session persistence katmanı
