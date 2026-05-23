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
  submitting: boolean;
  isExpired: boolean;
  onSelect: (index: number) => void;
}

export function AnswerOptions({ options, lockedIndex, submitting, isExpired, onSelect }: Props) {
  const isLocked = lockedIndex !== null || isExpired;

  return (
    <View className="gap-3">
      {options.map((opt, i) => {
        const style = OPTION_STYLES[i % OPTION_STYLES.length];
        const isSelected = lockedIndex === i;
        const dimmed = isLocked && !isSelected;

        return (
          <TouchableOpacity
            key={i}
            onPress={() => !isLocked && onSelect(i)}
            disabled={isLocked || submitting}
            activeOpacity={0.88}
            className={cn(
              'rounded-[24px] border px-4 py-4',
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

              {isSelected && !submitting ? (
                <Text className="text-sm font-semibold text-accent-cyan">Kilitli</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
