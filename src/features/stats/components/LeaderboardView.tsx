import { View, Text, FlatList } from 'react-native';
import type { LeaderboardEntry } from '@/features/quiz-engine/gameService';
import { ThemeChip, ThemeChipText, ThemePanel } from '@/components/ui/ThemePanel';
import { cn } from '@/lib/cn';

interface Props {
  entries: LeaderboardEntry[];
  myParticipantId?: string;
  title?: string;
}

export function LeaderboardView({ entries, myParticipantId, title = 'Sıralama' }: Props) {
  return (
    <ThemePanel tone="night" variant="soft" className="flex-1 gap-4 px-5 py-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="gap-1">
          <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-slate-400">
            Skor tablosu
          </Text>
          <Text className="text-2xl font-bold text-white">{title}</Text>
        </View>
        <ThemeChip tone="night" accent="primary">
          <ThemeChipText tone="night" accent="primary">Top 10</ThemeChipText>
        </ThemeChip>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.participant_id}
        contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
        renderItem={({ item, index }) => {
          const isMe = item.participant_id === myParticipantId;

          return (
            <View
              className={cn(
                'flex-row items-center gap-4 rounded-[22px] border px-4 py-4',
                isMe ? 'border-accent-cyan/25 bg-accent-cyan/10' : 'border-white/10 bg-white/5'
              )}
            >
              <View className={cn(
                'h-11 w-11 rounded-full items-center justify-center',
                isMe ? 'bg-accent-cyan/[0.15]' : 'bg-white/[0.08]'
              )}>
                <Text className={cn('text-sm font-bold', isMe ? 'text-accent-cyan' : 'text-slate-200')}>
                  {index + 1}
                </Text>
              </View>

              <View className="flex-1">
                <Text className={cn('text-base font-semibold', isMe ? 'text-accent-cyan' : 'text-white')} numberOfLines={1}>
                  {item.display_name}
                  {isMe ? ' (sen)' : ''}
                </Text>
                <Text className="mt-1 text-xs text-slate-400">
                  {item.correct_answers} doğru cevap
                </Text>
              </View>

              <View className="items-end">
                <Text className={cn('text-lg font-bold', isMe ? 'text-accent-cyan' : 'text-white')}>
                  {item.total_score.toLocaleString()}
                </Text>
                <Text className="text-[11px] uppercase tracking-[1px] text-slate-500">
                  puan
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-8">
            <Text className="text-center text-sm text-slate-300">Henüz puan oluşmadı.</Text>
          </View>
        }
      />
    </ThemePanel>
  );
}
