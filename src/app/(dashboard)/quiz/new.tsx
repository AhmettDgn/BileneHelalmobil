import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { QuizEditorForm } from '@/features/quiz-builder/components/QuizEditorForm';
import { ThemedScreen } from '@/components/ui/ThemedScreen';
import { ThemeChip, ThemeChipText, ThemePanel } from '@/components/ui/ThemePanel';

export default function NewQuizScreen() {
  return (
    <ThemedScreen tone="warm">
      <View className="flex-1 px-5 py-4 gap-4">
        <ThemePanel tone="warm" variant="hero" className="gap-4 px-5 py-5">
          <TouchableOpacity onPress={() => router.back()} className="self-start">
            <Text className="text-sm font-semibold text-accent-rose">← Dashboard</Text>
          </TouchableOpacity>

          <View className="gap-2">
            <ThemeChip tone="warm" accent="secondary" className="self-start">
              <ThemeChipText tone="warm" accent="secondary">
                Yeni Quiz
              </ThemeChipText>
            </ThemeChip>
            <Text className="text-3xl font-bold tracking-tight text-ink-strong">
              Yeni Quiz Oluştur
            </Text>
            <Text className="text-sm leading-6 text-ink-muted">
              Meta bilgiyi üstte tut, soruları akış halinde düzenle ve kaydı alttaki
              yapışkan panelden tamamla.
            </Text>
          </View>
        </ThemePanel>

        <QuizEditorForm />
      </View>
    </ThemedScreen>
  );
}
