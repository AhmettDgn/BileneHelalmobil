import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { cn } from '@/lib/cn';
import { APP_THEME } from '@/theme/app-theme';

const OPTION_STYLES = [
  {
    badge: 'A',
    bg: 'bg-accent-cyan/10',
    border: 'border-accent-cyan/30',
    text: 'text-white',
    badgeBg: 'bg-accent-cyan/[0.15]',
    badgeText: 'text-accent-cyan',
  },
  {
    badge: 'B',
    bg: 'bg-accent-fuchsia/10',
    border: 'border-accent-fuchsia/30',
    text: 'text-white',
    badgeBg: 'bg-accent-fuchsia/[0.15]',
    badgeText: 'text-accent-fuchsia',
  },
  {
    badge: 'C',
    bg: 'bg-white/5',
    border: 'border-white/[0.12]',
    text: 'text-white',
    badgeBg: 'bg-white/[0.08]',
    badgeText: 'text-slate-200',
  },
  {
    badge: 'D',
    bg: 'bg-blue-400/10',
    border: 'border-blue-300/25',
    text: 'text-white',
    badgeBg: 'bg-blue-400/[0.15]',
    badgeText: 'text-blue-200',
  },
];

interface Props {
  options: string[];
  lockedIndex: number | null;
  lockedIndex2?: number | null;
  submitting: boolean;
  isExpired: boolean;
  onSelect: (index: number, index2?: number | null) => void;
  isDoubleChance?: boolean;
  isMudAt?: boolean;
}

export function AnswerOptions({
  options,
  lockedIndex,
  lockedIndex2,
  submitting,
  isExpired,
  onSelect,
  isDoubleChance,
  isMudAt,
}: Props) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  useEffect(() => {
    setSelectedIndices([]);
  }, [options]);

  const isLocked = lockedIndex !== null || isExpired;

  const handlePress = (index: number) => {
    if (isDoubleChance) {
      if (selectedIndices.includes(index)) {
        setSelectedIndices(selectedIndices.filter((x) => x !== index));
      } else if (selectedIndices.length < 2) {
        setSelectedIndices([...selectedIndices, index]);
      }
    } else {
      onSelect(index);
    }
  };

  return (
    <View className="gap-3">
      {options.map((opt, i) => {
        const style = OPTION_STYLES[i % OPTION_STYLES.length];
        const isSelected = lockedIndex === i || lockedIndex2 === i || selectedIndices.includes(i);
        const dimmed = isLocked && !isSelected;

        return (
          <TouchableOpacity
            key={i}
            onPress={() => !isLocked && handlePress(i)}
            disabled={isLocked || submitting}
            activeOpacity={0.88}
            className={cn(
              'rounded-[24px] border px-4 py-4 relative overflow-hidden',
              style.bg,
              style.border,
              isSelected ? 'border-white/[0.35] bg-white/10' : '',
              dimmed ? 'opacity-45' : 'opacity-100'
            )}
          >
            <View className="flex-row items-center gap-4">
              <View className={cn('h-11 w-11 rounded-full items-center justify-center', style.badgeBg)}>
                <Text className={cn('text-base font-bold', style.badgeText)}>{style.badge}</Text>
              </View>

              <Text className={cn('flex-1 text-base font-semibold leading-6', style.text)} numberOfLines={3}>
                {opt}
              </Text>

              {isSelected && submitting ? (
                <ActivityIndicator color={APP_THEME.night.primary} size="small" />
              ) : null}

              {(lockedIndex === i || lockedIndex2 === i) && !submitting ? (
                <Text className="text-sm font-semibold text-accent-cyan">Kilitli</Text>
              ) : null}
            </View>

            {isMudAt && (
              <View pointerEvents="none" className="absolute inset-0 overflow-hidden rounded-[24px]">
                {i === 0 && <Text className="absolute top-1 left-4 text-2xl opacity-20">💩</Text>}
                {i === 1 && <Text className="absolute bottom-1 right-6 text-3xl opacity-15">💩</Text>}
                {i === 2 && <Text className="absolute top-2 right-8 text-2xl opacity-20">💩</Text>}
                {i === 3 && <Text className="absolute bottom-2 left-10 text-2xl opacity-25">💩</Text>}
                <View className="absolute inset-0 bg-[#5c4033]/[0.05]" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {isDoubleChance && !isLocked && selectedIndices.length > 0 && (
        <TouchableOpacity
          onPress={() => onSelect(selectedIndices[0], selectedIndices[1] ?? null)}
          disabled={submitting}
          className="mt-2 rounded-[20px] bg-accent-orange py-3.5 items-center shadow-lg"
        >
          <Text className="text-sm font-semibold text-white">
            {selectedIndices.length === 2 ? 'Çifte Şansı Kullan 🎭' : 'Tek Seçenek Gönder'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
