import { View, Text } from 'react-native';
import { ThemeChip, ThemeChipText, ThemePanel } from '@/components/ui/ThemePanel';
import { cn } from '@/lib/cn';
import type { QuestionResults } from '../gameService';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

interface RevealQuestion {
  text: string;
  options: string[];
}

interface Props {
  question: RevealQuestion | null;
  results: QuestionResults | null;
  myAnswerIndex?: number | null;
  title?: string;
}

export function QuestionResultsView({
  question,
  results,
  myAnswerIndex = null,
  title = 'Doğru Cevap',
}: Props) {
  const correctIndex = results?.correct_option_index ?? null;
  const answerers = results?.correct_answerers ?? [];

  return (
    <View className="gap-3.5">
      <ThemePanel tone="night" variant="hero" className="gap-3 px-5 py-5">
        <ThemeChip tone="night" accent="success" className="self-start">
          <ThemeChipText tone="night" accent="success">{title}</ThemeChipText>
        </ThemeChip>
        {question ? (
          <Text className="text-2xl font-bold leading-8 text-white">{question.text}</Text>
        ) : null}
        {results ? (
          <Text className="text-sm leading-6 text-slate-300">
            {results.correct_count} / {results.total_answers} oyuncu doğru cevapladı
          </Text>
        ) : (
          <Text className="text-sm leading-6 text-slate-300">Sonuçlar hazırlanıyor...</Text>
        )}
      </ThemePanel>

      {question ? (
        <ThemePanel tone="night" className="gap-3 px-5 py-5">
          {question.options.map((opt, i) => {
            const isCorrect = i === correctIndex;
            const isMyWrong = myAnswerIndex === i && !isCorrect;
            return (
              <View
                key={i}
                className={cn(
                  'rounded-[22px] border px-4 py-4 flex-row items-center gap-4',
                  isCorrect
                    ? 'border-state-success/40 bg-state-success/15'
                    : isMyWrong
                      ? 'border-state-danger/40 bg-state-danger/15'
                      : 'border-white/10 bg-white/5'
                )}
              >
                <View
                  className={cn(
                    'h-10 w-10 rounded-full items-center justify-center',
                    isCorrect
                      ? 'bg-state-success/20'
                      : isMyWrong
                        ? 'bg-state-danger/20'
                        : 'bg-white/5'
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-bold',
                      isCorrect
                        ? 'text-state-success'
                        : isMyWrong
                          ? 'text-state-danger'
                          : 'text-slate-200'
                    )}
                  >
                    {OPTION_LABELS[i] ?? `${i + 1}`}
                  </Text>
                </View>
                <Text className="flex-1 text-base font-semibold text-white">
                  {opt}
                </Text>
                {isCorrect ? (
                  <Text className="text-lg font-bold text-state-success">✓</Text>
                ) : isMyWrong ? (
                  <Text className="text-lg font-bold text-state-danger">✗</Text>
                ) : null}
              </View>
            );
          })}
        </ThemePanel>
      ) : null}

      <ThemePanel tone="night" variant="soft" className="gap-3 px-5 py-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-white">Doğru Cevaplayanlar</Text>
          <ThemeChip tone="night" accent="success">
            <ThemeChipText tone="night" accent="success">{answerers.length} kişi</ThemeChipText>
          </ThemeChip>
        </View>
        {answerers.length === 0 ? (
          <Text className="text-sm text-slate-300">Bu soruyu doğru bilen olmadı.</Text>
        ) : (
          answerers.slice(0, 8).map((a, idx) => (
            <View
              key={a.participant_id}
              className="flex-row items-center gap-3 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3"
            >
              <Text className="w-5 text-xs font-bold text-slate-400">{idx + 1}</Text>
              <Text className="flex-1 text-sm font-semibold text-white" numberOfLines={1}>
                {a.display_name}
              </Text>
              <Text className="text-xs text-slate-400">
                {(a.response_time_ms / 1000).toFixed(1)} sn
              </Text>
            </View>
          ))
        )}
      </ThemePanel>
    </View>
  );
}
