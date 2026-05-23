import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { QuizEditorForm } from '@/features/quiz-builder/components/QuizEditorForm';
import { getQuizWithQuestions } from '@/features/quiz-builder/quizService';
import type { QuizWithQuestions } from '@/features/quiz-builder/quizService';
import { ThemedScreen } from '@/components/ui/ThemedScreen';
import { ThemeChip, ThemeChipText, ThemePanel } from '@/components/ui/ThemePanel';
import { APP_THEME } from '@/theme/app-theme';

export default function EditQuizScreen() {
  const { quizId } = useLocalSearchParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQuizWithQuestions(quizId)
      .then(setQuiz)
      .catch((e) => Alert.alert('Hata', e.message))
      .finally(() => setLoading(false));
  }, [quizId]);

  return (
    <ThemedScreen tone="warm">
      <View className="flex-1 px-5 py-4 gap-4">
        <ThemePanel tone="warm" variant="hero" className="gap-4 px-5 py-5">
          <TouchableOpacity onPress={() => router.back()} className="self-start">
            <Text className="text-sm font-semibold text-accent-rose">← Dashboard</Text>
          </TouchableOpacity>

          <View className="gap-2">
            <ThemeChip tone="warm" accent="primary" className="self-start">
              <ThemeChipText tone="warm" accent="primary">
                Quiz Düzenleme
              </ThemeChipText>
            </ThemeChip>
            <Text className="text-3xl font-bold tracking-tight text-ink-strong">
              Quiz Düzenle
            </Text>
            <Text className="text-sm leading-6 text-ink-muted">
              Soru sırası, içerik ve puan ayarlarını aynı sıcak panel dili içinde güncelle.
            </Text>
          </View>
        </ThemePanel>

        {loading ? (
          <ThemePanel tone="warm" className="flex-1 items-center justify-center gap-4 px-5 py-8">
            <ActivityIndicator size="large" color={APP_THEME.warm.primary} />
            <Text className="text-sm text-ink-muted">Quiz verisi yükleniyor...</Text>
          </ThemePanel>
        ) : quiz ? (
          <QuizEditorForm existing={quiz} />
        ) : null}
      </View>
    </ThemedScreen>
  );
}
