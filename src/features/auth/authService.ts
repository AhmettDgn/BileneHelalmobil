import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@/lib/supabase/client';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

// OAuth dönüş URL'inden hem query (`?code=`, PKCE) hem fragment (`#access_token=`,
// implicit) parametrelerini güvenli biçimde ayıklar.
function parseAuthRedirectParams(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  const qIndex = url.indexOf('?');
  const hIndex = url.indexOf('#');

  const collect = (segment?: string) => {
    if (!segment) return;
    for (const pair of segment.split('&')) {
      if (!pair) continue;
      const eq = pair.indexOf('=');
      const key = decodeURIComponent(eq >= 0 ? pair.slice(0, eq) : pair);
      const value = eq >= 0 ? decodeURIComponent(pair.slice(eq + 1)) : '';
      if (key) out[key] = value;
    }
  };

  if (qIndex >= 0) collect(url.slice(qIndex + 1, hIndex >= 0 ? hIndex : undefined));
  if (hIndex >= 0) collect(url.slice(hIndex + 1));
  return out;
}

/** Oturum kurulduysa `true`, kullanıcı iptal ettiyse `false` döner. */
export async function signInWithGoogle(): Promise<boolean> {
  // Ortama göre otomatik: Expo Go -> exp://<IP>:8081/--/auth/callback,
  // dev build / standalone -> bilenehelalmobil://auth/callback (app.json scheme).
  // Bu DEĞER, Supabase Dashboard -> Authentication -> URL Configuration ->
  // Redirect URLs listesine BİREBİR eklenmelidir; aksi halde Supabase Site URL'ye
  // (localhost:3000) geri döner.
  const redirectUrl = AuthSession.makeRedirectUri({ path: 'auth/callback' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('OAuth URL alınamadı');

  if (__DEV__) {
    // TEŞHİS: Supabase'e giden gerçek `redirect_to` ve provider'ı göster.
    const rtMatch = data.url.match(/[?&]redirect_to=([^&]+)/);
    const sentRedirect = rtMatch ? decodeURIComponent(rtMatch[1]) : '(redirect_to YOK!)';
    const provMatch = data.url.match(/[?&]provider=([^&]+)/);
    console.log('[auth] authorize url:', data.url);
    await new Promise<void>((resolve) => {
      Alert.alert(
        'OAuth teşhis (dev)',
        `provider=${provMatch ? provMatch[1] : '?'}\n\n` +
          `Supabase'e giden redirect_to:\n${sentRedirect}\n\n` +
          `(authorize host: ${data.url.split('/auth/')[0]})`,
        [{ text: 'Devam', onPress: () => resolve() }],
        { cancelable: false }
      );
    });
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

  // Kullanıcı tarayıcıyı kapattıysa/iptal ettiyse sessizce çık.
  if (result.type !== 'success') return false;

  const params = parseAuthRedirectParams(result.url);

  if (params.error) {
    throw new Error(params.error_description || params.error);
  }

  // PKCE akışı: ?code=... -> oturuma çevir.
  if (params.code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
    if (exchangeError) throw exchangeError;
    return true;
  }

  // Implicit akış yedeği: #access_token=...&refresh_token=...
  if (params.access_token && params.refresh_token) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (sessionError) throw sessionError;
    return true;
  }

  throw new Error('OAuth dönüşünde oturum bilgisi bulunamadı.');
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function updateProfile(updates: {
  displayName?: string;
  email?: string;
  password?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Kullanıcı bulunamadı.');

  const updateData: any = {};

  if (updates.displayName !== undefined) {
    updateData.data = {
      ...user.user_metadata,
      display_name: updates.displayName,
    };
  }

  if (updates.email !== undefined && updates.email !== user.email) {
    updateData.email = updates.email;
  }

  if (updates.password !== undefined && updates.password !== '') {
    updateData.password = updates.password;
  }

  const { data, error } = await supabase.auth.updateUser(updateData);
  if (error) throw error;
  return data;
}

