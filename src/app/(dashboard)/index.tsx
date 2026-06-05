import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/features/auth/AuthProvider';
import { signOut } from '@/features/auth/authService';
import { listQuizzes, deleteQuiz, createGameSession } from '@/features/quiz-builder/quizService';
import type { Database } from '@/lib/supabase/database.types';
import { ThemedScreen } from '@/components/ui/ThemedScreen';
import { ThemeChip, ThemeChipText, ThemePanel } from '@/components/ui/ThemePanel';
import { APP_THEME } from '@/theme/app-theme';

type Quiz = Database['public']['Tables']['quizzes']['Row'];

export default function DashboardScreen() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  const fetchQuizzes = useCallback(async () => {
    try {
      const data = await listQuizzes();
      setQuizzes(data);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  async function handleStart(quizId: string) {
    setStartingId(quizId);
    try {
      const sessionId = await createGameSession(quizId);
      router.push(`/(game)/host/${sessionId}`);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setStartingId(null);
    }
  }

  async function handleDelete(quizId: string, title: string) {
    Alert.alert('Quizi Sil', `"${title}" silinecek. Emin misin?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteQuiz(quizId);
            setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
          } catch (e: any) {
            Alert.alert('Hata', e.message);
          }
        },
      },
    ]);
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/');
  }

  if (loading) {
    return (
      <ThemedScreen tone="warm" contentClassName="justify-center px-5">
        <ThemePanel tone="warm" className="items-center gap-4 px-5 py-6">
          <ActivityIndicator size="large" color={APP_THEME.warm.primary} />
          <Text className="text-base text-ink-muted">Quizler hazırlanıyor...</Text>
        </ThemePanel>
      </ThemedScreen>
    );
  }

  return (
    <ThemedScreen tone="warm">
      <View className="flex-1 px-5 py-4 gap-4">
        <ThemePanel tone="warm" variant="hero" className="gap-5 px-5 py-5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-2">
              <ThemeChip tone="warm" accent="primary" className="self-start">
                <ThemeChipText tone="warm" accent="primary">Dashboard</ThemeChipText>
              </ThemeChip>
              <Text className="text-3xl font-bold tracking-tight text-ink-strong">
                Quizlerim
              </Text>
              <Text className="text-sm leading-6 text-ink-muted">
                Oluşturduğun quizleri yönet, PIN üreten canlı oyunlar başlat ve soru
                setlerini tek panelden düzenle.
              </Text>
              <Text className="text-xs text-ink-soft">{user?.email}</Text>
            </View>

            <View className="flex-row gap-2 items-center">
              <TouchableOpacity
                onPress={() => router.push('/(dashboard)/profile')}
                className="rounded-full border border-accent-orange/20 bg-white px-4 py-2.5"
              >
                <Text className="text-sm font-semibold text-accent-orange">Profil</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSignOut}
                className="rounded-full border border-accent-rose/20 bg-white px-4 py-2.5"
              >
                <Text className="text-sm font-semibold text-accent-rose">Çıkış</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row gap-2">
            <ThemeChip tone="warm" accent="primary" className="flex-1 rounded-[18px] px-3 py-3">
              <ThemeChipText tone="warm" accent="primary" className="text-[10px]">
                Toplam
              </ThemeChipText>
              <Text className="mt-1 text-lg font-semibold text-ink-strong">{quizzes.length}</Text>
            </ThemeChip>
            <ThemeChip tone="warm" accent="secondary" className="flex-1 rounded-[18px] px-3 py-3">
              <ThemeChipText tone="warm" accent="secondary" className="text-[10px]">
                Yayında
              </ThemeChipText>
              <Text className="mt-1 text-lg font-semibold text-ink-strong">
                {quizzes.filter((item) => item.is_published).length}
              </Text>
            </ThemeChip>
            <ThemeChip tone="warm" className="flex-1 rounded-[18px] px-3 py-3">
              <ThemeChipText tone="warm" className="text-[10px]">Akış</ThemeChipText>
              <Text className="mt-1 text-sm font-semibold text-ink-strong">Canlı PIN</Text>
            </ThemeChip>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(dashboard)/quiz/new')}
            className="rounded-[22px] bg-accent-rose px-5 py-4 items-center"
          >
            <Text className="text-base font-semibold text-white">+ Yeni Quiz Oluştur</Text>
          </TouchableOpacity>
        </ThemePanel>

        <FlatList
          data={quizzes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={APP_THEME.warm.primary}
              onRefresh={() => {
                setRefreshing(true);
                fetchQuizzes();
              }}
            />
          }
          ListEmptyComponent={
            <ThemePanel tone="warm" className="items-center gap-3 px-5 py-10">
              <Text className="text-xl font-semibold text-ink-strong">Henüz quiz yok.</Text>
              <Text className="text-center text-sm leading-6 text-ink-muted">
                İlk soru setini oluşturduğunda host panelinden anında canlı oyun
                başlatabileceksin.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(dashboard)/quiz/new')}
                className="mt-2 rounded-[20px] bg-accent-orange px-5 py-3.5"
              >
                <Text className="text-sm font-semibold text-white">İlk Quizini Oluştur</Text>
              </TouchableOpacity>
            </ThemePanel>
          }
          renderItem={({ item }) => (
            <ThemePanel tone="warm" variant="soft" className="gap-4 px-5 py-5">
              <View className="gap-2">
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="flex-1 text-lg font-semibold text-ink-strong" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <ThemeChip
                    tone="warm"
                    accent={item.is_published ? 'success' : 'neutral'}
                    className="px-3 py-2"
                  >
                    <ThemeChipText
                      tone="warm"
                      accent={item.is_published ? 'success' : 'neutral'}
                      className="text-[10px]"
                    >
                      {item.is_published ? 'Yayında' : 'Taslak'}
                    </ThemeChipText>
                  </ThemeChip>
                </View>

                {item.description ? (
                  <Text className="text-sm leading-6 text-ink-muted" numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : (
                  <Text className="text-sm leading-6 text-ink-soft">
                    Açıklama eklenmemiş.
                  </Text>
                )}
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => handleStart(item.id)}
                  disabled={startingId === item.id}
                  className="flex-1 rounded-[20px] bg-accent-rose py-3.5 items-center"
                >
                  {startingId === item.id ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-sm font-semibold text-white">Oyunu Başlat</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push(`/(dashboard)/quiz/${item.id}/edit`)}
                  className="flex-1 rounded-[20px] border border-accent-orange/20 bg-white py-3.5 items-center"
                >
                  <Text className="text-sm font-semibold text-accent-orange">Düzenle</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDelete(item.id, item.title)}
                  className="rounded-[20px] border border-state-danger/20 bg-state-danger/10 px-4 items-center justify-center"
                >
                  <Text className="text-sm font-semibold text-state-danger">Sil</Text>
                </TouchableOpacity>
              </View>
            </ThemePanel>
          )}
        />
      </View>
    </ThemedScreen>
  );
}
