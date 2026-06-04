import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { generateQuestionsFromSource } from '../aiService';
import type { QuestionDraft } from '../quizService';
import { ThemePanel } from '@/components/ui/ThemePanel';
import { APP_THEME } from '@/theme/app-theme';
import { cn } from '@/lib/cn';

export type ApplyMode = 'append' | 'replace';

interface AiQuestionGeneratorProps {
  onApply: (questions: QuestionDraft[], mode: ApplyMode) => void;
  defaultTimeLimitSeconds: number;
  defaultPoints: number;
  disabled?: boolean;
}

type Difficulty = 'kolay' | 'orta' | 'zor';

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'kolay', label: 'Kolay' },
  { value: 'orta', label: 'Orta' },
  { value: 'zor', label: 'Zor' },
];

export function AiQuestionGenerator({
  onApply,
  defaultTimeLimitSeconds,
  defaultPoints,
  disabled,
}: AiQuestionGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileObject, setFileObject] = useState<File | null>(null); // For Web File object
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState('10');
  const [difficulty, setDifficulty] = useState<Difficulty>('orta');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<QuestionDraft[] | null>(null);

  const parsedCount = parseInt(count, 10) || 10;
  const canGenerate = !disabled && !isGenerating && (fileUri !== null || topic.trim().length > 0);

  const resetInputs = () => {
    setFileUri(null);
    setFileName(null);
    setFileObject(null);
    setTopic('');
    setGenerated(null);
    setError(null);
  };

  const handlePickDocument = async () => {
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFileUri(asset.uri);
        setFileName(asset.name);
        setFileObject(asset.file ?? null);
      }
    } catch {
      setError('Dosya seçilirken bir hata oluştu.');
    }
  };

  const handleGenerate = async () => {
    setError(null);
    setGenerated(null);
    setIsGenerating(true);

    try {
      const result = await generateQuestionsFromSource({
        topic,
        pdfUri: fileUri || undefined,
        pdfFile: fileObject,
        count: parsedCount,
        difficulty,
        defaultTimeLimitSeconds,
        defaultPoints,
      });
      setGenerated(result.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = (mode: ApplyMode) => {
    if (!generated) return;
    onApply(generated, mode);
    resetInputs();
    setOpen(false);
  };

  return (
    <ThemePanel tone="warm" variant="soft" className="gap-3 px-5 py-4">
      <TouchableOpacity
        onPress={() => setOpen((prev) => !prev)}
        className="flex-row items-center justify-between gap-3"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center gap-3 flex-1">
          <Text className="text-xl">✨</Text>
          <View className="flex-1">
            <Text className="text-base font-semibold text-ink-strong">
              AI ile Soru Hazırla
            </Text>
            <Text className="text-xs text-ink-muted mt-0.5">
              PDF yükle ya da bir konu yaz; Gemini sorularını hazırlasın.
            </Text>
          </View>
        </View>
        <Text className="text-lg font-bold text-accent-orange">
          {open ? '−' : '+'}
        </Text>
      </TouchableOpacity>

      {open && (
        <View className="mt-3 border-t border-accent-orange/10 pt-4 gap-4">
          {error && (
            <View className="rounded-2xl border border-state-danger/25 bg-state-danger/10 p-3">
              <Text className="text-xs text-state-danger font-medium leading-5">
                {error}
              </Text>
            </View>
          )}

          {/* File Picker */}
          <View className="gap-2">
            <Text className="text-sm font-semibold uppercase tracking-[1.4px] text-accent-rose">
              PDF (İsteğe Bağlı)
            </Text>
            <TouchableOpacity
              onPress={handlePickDocument}
              disabled={disabled || isGenerating}
              className="h-13 rounded-[20px] border border-dashed border-accent-rose/25 bg-white items-center justify-center flex-row gap-2 px-4 py-3"
              activeOpacity={0.8}
            >
              <Text className="text-sm font-semibold text-accent-rose">
                {fileName ? 'Dosyayı Değiştir' : 'PDF Dosyası Seç'}
              </Text>
            </TouchableOpacity>
            {fileName && (
              <View className="flex-row items-center justify-between bg-white/50 rounded-[14px] px-3 py-2 border border-accent-rose/10">
                <Text className="text-xs text-ink-strong flex-1 truncate" numberOfLines={1}>
                  📄 {fileName}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setFileUri(null);
                    setFileName(null);
                    setFileObject(null);
                  }}
                  className="px-2"
                >
                  <Text className="text-xs font-bold text-state-danger">Kaldır</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Topic Input */}
          <View className="gap-2">
            <Text className="text-sm font-semibold uppercase tracking-[1.4px] text-accent-orange">
              Konu / Talimat (İsteğe Bağlı)
            </Text>
            <TextInput
              className="min-h-[80px] rounded-[22px] border border-accent-orange/[0.15] bg-white px-4 py-3 text-sm leading-6 text-ink-strong"
              placeholder="Örn: Osmanlı kuruluş dönemi, orta zorlukta tarih soruları"
              placeholderTextColor={APP_THEME.warm.muted}
              value={topic}
              onChangeText={setTopic}
              editable={!disabled && !isGenerating}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Settings Grid */}
          <View className="flex-row gap-3">
            <View className="flex-1 gap-2">
              <Text className="text-sm font-semibold uppercase tracking-[1.4px] text-accent-rose">
                Soru Sayısı
              </Text>
              <TextInput
                className="h-12 rounded-[18px] border border-accent-rose/[0.15] bg-white px-4 text-sm text-ink-strong"
                value={count}
                onChangeText={setCount}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor={APP_THEME.warm.muted}
                editable={!disabled && !isGenerating}
              />
            </View>

            <View className="flex-2 gap-2" style={{ flex: 2 }}>
              <Text className="text-sm font-semibold uppercase tracking-[1.4px] text-accent-orange">
                Zorluk
              </Text>
              <View className="flex-row border border-accent-orange/[0.15] rounded-[18px] overflow-hidden bg-white h-12 p-0.5">
                {DIFFICULTIES.map((opt) => {
                  const isActive = difficulty === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setDifficulty(opt.value)}
                      disabled={disabled || isGenerating}
                      className={cn(
                        'flex-1 items-center justify-center rounded-[15px]',
                        isActive ? 'bg-accent-orange' : 'bg-transparent'
                      )}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={cn(
                          'text-xs font-semibold',
                          isActive ? 'text-white' : 'text-ink-strong'
                        )}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Generate & Apply Actions */}
          {generated ? (
            <ThemePanel tone="warm" variant="hero" className="gap-3 p-4 mt-1 border border-accent-orange/20">
              <Text className="text-sm font-semibold text-ink-strong text-center">
                ✨ {generated.length} soru başarıyla üretildi!
              </Text>
              <Text className="text-xs text-ink-muted text-center leading-4">
                Soruları mevcut listenizin altına ekleyebilir veya listenizdeki tüm sorularla yer değiştirebilirsiniz.
              </Text>
              <View className="flex-row gap-2 mt-1">
                <TouchableOpacity
                  onPress={() => handleApply('append')}
                  className="flex-1 rounded-[16px] bg-accent-orange py-3 items-center"
                >
                  <Text className="text-xs font-semibold text-white">Listeye Ekle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleApply('replace')}
                  className="flex-1 rounded-[16px] border border-accent-rose bg-white py-3 items-center"
                >
                  <Text className="text-xs font-semibold text-accent-rose">Yerine Koy</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setGenerated(null)}
                className="py-1 items-center mt-1"
              >
                <Text className="text-xs font-semibold text-ink-soft">Vazgeç</Text>
              </TouchableOpacity>
            </ThemePanel>
          ) : (
            <TouchableOpacity
              onPress={handleGenerate}
              disabled={!canGenerate}
              className={cn(
                'rounded-[20px] py-4 items-center justify-center flex-row gap-2',
                canGenerate ? 'bg-accent-rose' : 'bg-accent-rose/40'
              )}
              activeOpacity={0.85}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-sm font-semibold text-white">Soru Üretiliyor...</Text>
                </>
              ) : (
                <Text className="text-sm font-semibold text-white">✨ AI ile Soruları Üret</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </ThemePanel>
  );
}
