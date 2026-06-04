import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { createQuiz, updateQuiz } from '../quizService';
import type { QuestionDraft, QuizWithQuestions } from '../quizService';
import { AiQuestionGenerator } from './AiQuestionGenerator';
import { ThemeChip, ThemeChipText, ThemePanel } from '@/components/ui/ThemePanel';
import { APP_THEME } from '@/theme/app-theme';
import { cn } from '@/lib/cn';

const DEFAULT_QUESTION: QuestionDraft = {
  text: '',
  options: ['', '', '', ''],
  correct_option_index: 0,
  time_limit_seconds: 20,
  points: 100,
};

interface Props {
  existing?: QuizWithQuestions;
}

export function QuizEditorForm({ existing }: Props) {
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [funMode, setFunMode] = useState(existing?.fun_mode ?? false);
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    existing?.questions.map((q) => ({
      text: q.text,
      options: q.options,
      correct_option_index: q.correct_option_index,
      time_limit_seconds: q.time_limit_seconds,
      points: q.points,
    })) ?? []
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  function addQuestion() {
    const newQ = { ...DEFAULT_QUESTION, options: ['', '', '', ''] };
    setQuestions((prev) => [...prev, newQ]);
    setEditingIndex(questions.length);
  }

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const options = [...q.options];
        options[oIndex] = value;
        return { ...q, options };
      })
    );
  }

  function removeQuestion(index: number) {
    Alert.alert('Soruyu Sil', 'Bu soru silinecek. Emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          setQuestions((prev) => prev.filter((_, i) => i !== index));
          if (editingIndex === index) {
            setEditingIndex(null);
          }
        },
      },
    ]);
  }

  function applyGeneratedQuestions(drafts: QuestionDraft[], mode: 'append' | 'replace') {
    if (mode === 'replace') {
      setQuestions(drafts);
    } else {
      setQuestions((prev) => [...prev, ...drafts]);
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Hata', 'Quiz başlığı gerekli.');
      return;
    }
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      if (!q.text.trim()) {
        Alert.alert('Hata', `${i + 1}. sorunun metni boş.`);
        return;
      }
      if (q.options.some((o) => !o.trim())) {
        Alert.alert('Hata', `${i + 1}. sorunun tüm seçenekleri dolu olmalı.`);
        return;
      }
    }

    setSaving(true);
    try {
      if (existing) {
        await updateQuiz(existing.id, title.trim(), description.trim(), questions, funMode);
      } else {
        await createQuiz(title.trim(), description.trim(), questions, funMode);
      }
      router.replace('/(dashboard)');
    } catch (e: any) {
      Alert.alert('Kayıt Hatası', e.message);
    } finally {
      setSaving(false);
    }
  }

  const activeQ = editingIndex !== null ? questions[editingIndex] : null;

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {activeQ !== null && editingIndex !== null ? (
        <View className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 132, gap: 14 }}
            showsVerticalScrollIndicator={false}
          >
            <ThemePanel tone="warm" variant="soft" className="gap-3 px-5 py-5">
              <TouchableOpacity onPress={() => setEditingIndex(null)} className="self-start">
                <Text className="text-sm font-semibold text-accent-rose">← Soru listesi</Text>
              </TouchableOpacity>
              <View className="gap-2">
                <ThemeChip tone="warm" accent="primary" className="self-start">
                  <ThemeChipText tone="warm" accent="primary">
                    Soru {editingIndex + 1}
                  </ThemeChipText>
                </ThemeChip>
                <Text className="text-xl font-semibold text-ink-strong">
                  Aktif soruyu düzenle
                </Text>
                <Text className="text-sm leading-6 text-ink-muted">
                  Metin, seçenekler ve doğru cevap işaretini aynı sıcak panelde yönet.
                </Text>
              </View>
            </ThemePanel>

            <ThemePanel tone="warm" className="gap-3 px-5 py-5">
              <Text className="text-sm font-semibold uppercase tracking-[1.4px] text-accent-rose">
                Soru Metni
              </Text>
              <TextInput
                className="min-h-[110px] rounded-[22px] border border-accent-rose/[0.15] bg-white px-4 py-4 text-base leading-6 text-ink-strong"
                placeholder="Soruyu buraya yaz..."
                placeholderTextColor={APP_THEME.warm.muted}
                value={activeQ.text}
                onChangeText={(v) => updateQuestion(editingIndex, { text: v })}
                multiline
                textAlignVertical="top"
              />
            </ThemePanel>

            <ThemePanel tone="warm" className="gap-3 px-5 py-5">
              <View className="gap-1">
                <Text className="text-sm font-semibold uppercase tracking-[1.4px] text-accent-orange">
                  Seçenekler
                </Text>
                <Text className="text-sm leading-6 text-ink-muted">
                  Doğru cevabı soldaki işaretle belirle.
                </Text>
              </View>

              {activeQ.options.map((opt, oIdx) => {
                const isCorrect = activeQ.correct_option_index === oIdx;

                return (
                  <View
                    key={oIdx}
                    className={cn(
                      'flex-row items-center gap-3 rounded-[20px] border px-3 py-3',
                      isCorrect
                        ? 'border-accent-orange/25 bg-accent-orange/10'
                        : 'border-accent-rose/[0.15] bg-white'
                    )}
                  >
                    <TouchableOpacity
                      onPress={() => updateQuestion(editingIndex, { correct_option_index: oIdx })}
                      className={cn(
                        'h-9 w-9 rounded-full border-2 items-center justify-center',
                        isCorrect
                          ? 'border-accent-orange bg-accent-orange'
                          : 'border-line-warm bg-white'
                      )}
                    >
                      {isCorrect ? <Text className="text-sm font-bold text-white">✓</Text> : null}
                    </TouchableOpacity>

                    <TextInput
                      className="flex-1 text-sm leading-6 text-ink-strong"
                      placeholder={`Seçenek ${oIdx + 1}`}
                      placeholderTextColor={APP_THEME.warm.muted}
                      value={opt}
                      onChangeText={(v) => updateOption(editingIndex, oIdx, v)}
                    />
                  </View>
                );
              })}
            </ThemePanel>

            <ThemePanel tone="warm" variant="soft" className="gap-4 px-5 py-5">
              <View className="gap-3">
                <Text className="text-sm font-semibold uppercase tracking-[1.4px] text-accent-rose">
                  Süre
                </Text>
                <View className="flex-row gap-2">
                  {[10, 20, 30, 60].map((t) => {
                    const active = activeQ.time_limit_seconds === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => updateQuestion(editingIndex, { time_limit_seconds: t })}
                        className={cn(
                          'flex-1 rounded-[18px] border py-3 items-center',
                          active
                            ? 'border-accent-rose bg-accent-rose'
                            : 'border-accent-rose/[0.15] bg-white'
                        )}
                      >
                        <Text className={cn('text-sm font-semibold', active ? 'text-white' : 'text-ink-strong')}>
                          {t} sn
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View className="gap-3">
                <Text className="text-sm font-semibold uppercase tracking-[1.4px] text-accent-orange">
                  Puan
                </Text>
                <View className="flex-row gap-2">
                  {[50, 100, 200].map((p) => {
                    const active = activeQ.points === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        onPress={() => updateQuestion(editingIndex, { points: p })}
                        className={cn(
                          'flex-1 rounded-[18px] border py-3 items-center',
                          active
                            ? 'border-accent-orange bg-accent-orange'
                            : 'border-accent-orange/[0.15] bg-white'
                        )}
                      >
                        <Text className={cn('text-sm font-semibold', active ? 'text-white' : 'text-ink-strong')}>
                          {p}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => removeQuestion(editingIndex)}
                className="rounded-[20px] border border-state-danger/20 bg-state-danger/10 py-3.5 items-center"
              >
                <Text className="text-sm font-semibold text-state-danger">Bu Soruyu Sil</Text>
              </TouchableOpacity>
            </ThemePanel>
          </ScrollView>

          <View className="absolute bottom-0 left-0 right-0 px-1 pb-2 pt-3">
            <ThemePanel tone="warm" variant="hero" className="flex-row gap-3 px-4 py-4">
              <TouchableOpacity
                onPress={() => setEditingIndex(null)}
                className="flex-1 rounded-[20px] border border-accent-orange/20 bg-surface-warm-soft py-3.5 items-center"
              >
                <Text className="text-sm font-semibold text-accent-orange">Listeye Dön</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="flex-1 rounded-[20px] bg-accent-rose py-3.5 items-center"
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-sm font-semibold text-white">
                    {existing ? 'Güncellemeyi Kaydet' : 'Quizi Kaydet'}
                  </Text>
                )}
              </TouchableOpacity>
            </ThemePanel>
          </View>
        </View>
      ) : (
        <View className="flex-1">
          <FlatList
            data={questions}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ paddingBottom: 150, gap: 12 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View className="gap-4 pb-4">
                <ThemePanel tone="warm" className="gap-3 px-5 py-5">
                  <View className="gap-2">
                    <Text className="text-sm font-semibold uppercase tracking-[1.4px] text-accent-rose">
                      Quiz Bilgisi
                    </Text>
                    <Text className="text-sm leading-6 text-ink-muted">
                      Başlık ve açıklamayı burada sabitle, soruları alttaki kartlardan sırayla aç.
                    </Text>
                  </View>

                  <TextInput
                    className="rounded-[22px] border border-accent-rose/[0.15] bg-white px-4 py-3.5 text-base text-ink-strong"
                    placeholder="Quiz başlığı *"
                    placeholderTextColor={APP_THEME.warm.muted}
                    value={title}
                    onChangeText={setTitle}
                  />
                  <TextInput
                    className="min-h-[92px] rounded-[22px] border border-accent-orange/[0.15] bg-white px-4 py-3.5 text-sm leading-6 text-ink-strong"
                    placeholder="Açıklama (isteğe bağlı)"
                    placeholderTextColor={APP_THEME.warm.muted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    textAlignVertical="top"
                  />
                  <TouchableOpacity
                    onPress={() => setFunMode(!funMode)}
                    className={cn(
                      "flex-row items-center justify-between rounded-[22px] border px-4 py-3.5 mt-2",
                      funMode
                        ? "border-accent-orange bg-accent-orange/10"
                        : "border-accent-rose/[0.15] bg-white"
                    )}
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-semibold text-ink-strong">Eğlence Modu 🥳</Text>
                      <ThemeChip tone="warm" accent={funMode ? "primary" : "secondary"}>
                        <ThemeChipText tone="warm" accent={funMode ? "primary" : "secondary"}>
                          {funMode ? "Jokerler Açık" : "Kapalı"}
                        </ThemeChipText>
                      </ThemeChip>
                    </View>
                    <View
                      className={cn(
                        "w-12 h-6 rounded-full p-0.5 justify-center",
                        funMode ? "bg-accent-orange items-end" : "bg-line-warm items-start"
                      )}
                    >
                      <View className="w-5 h-5 rounded-full bg-white shadow" />
                    </View>
                  </TouchableOpacity>
                </ThemePanel>

                <AiQuestionGenerator
                  onApply={applyGeneratedQuestions}
                  defaultTimeLimitSeconds={20}
                  defaultPoints={100}
                />

                <ThemePanel tone="warm" variant="soft" className="flex-row items-center justify-between px-5 py-4">
                  <View>
                    <Text className="text-sm font-semibold uppercase tracking-[1.4px] text-accent-orange">
                      Soru Listesi
                    </Text>
                    <Text className="mt-1 text-sm text-ink-muted">{questions.length} soru hazır</Text>
                  </View>
                  <ThemeChip tone="warm" accent="secondary">
                    <ThemeChipText tone="warm" accent="secondary">
                      Mobil editör
                    </ThemeChipText>
                  </ThemeChip>
                </ThemePanel>
              </View>
            }
            ListEmptyComponent={
              <ThemePanel tone="warm" className="items-center gap-3 px-5 py-8">
                <Text className="text-lg font-semibold text-ink-strong">Henüz soru yok.</Text>
                <Text className="text-center text-sm leading-6 text-ink-muted">
                  İlk soruyu eklediğinde akış panelden düzenlenebilir hale gelecek.
                </Text>
              </ThemePanel>
            }
            renderItem={({ item, index }) => (
              <TouchableOpacity onPress={() => setEditingIndex(index)}>
                <ThemePanel tone="warm" variant="soft" className="gap-3 px-5 py-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="h-10 w-10 rounded-full bg-accent-rose/[0.12] items-center justify-center">
                        <Text className="text-sm font-semibold text-accent-rose">{index + 1}</Text>
                      </View>
                      <View className="flex-1 gap-1">
                        <Text className="text-base font-semibold text-ink-strong">
                          {item.text.trim() || 'Boş soru'}
                        </Text>
                        <Text className="text-xs text-ink-soft">
                          {item.points} puan • {item.time_limit_seconds} sn
                        </Text>
                      </View>
                    </View>

                    <Text className="text-lg text-accent-orange">›</Text>
                  </View>
                </ThemePanel>
              </TouchableOpacity>
            )}
          />

          <View className="absolute bottom-0 left-0 right-0 px-1 pb-2 pt-3">
            <ThemePanel tone="warm" variant="hero" className="gap-3 px-4 py-4">
              <TouchableOpacity
                onPress={addQuestion}
                className="rounded-[20px] border border-dashed border-accent-orange/25 bg-surface-warm-soft py-3.5 items-center"
              >
                <Text className="text-sm font-semibold text-accent-orange">+ Soru Ekle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="rounded-[20px] bg-accent-rose py-4 items-center"
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-base font-semibold text-white">
                    {existing ? 'Değişiklikleri Kaydet' : 'Quiz Oluştur'}
                  </Text>
                )}
              </TouchableOpacity>
            </ThemePanel>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
