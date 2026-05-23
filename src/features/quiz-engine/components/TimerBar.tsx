import { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { ThemeChip, ThemeChipText } from '@/components/ui/ThemePanel';
import { APP_THEME } from '@/theme/app-theme';

interface Props {
  progress: number;
  remainingMs: number;
}

export function TimerBar({ progress, remainingMs }: Props) {
  const anim = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progress, anim]);

  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const isUrgent = progress < 0.25;
  const isMedium = progress < 0.5;

  const barColor = isUrgent
    ? APP_THEME.shared.danger
    : isMedium
      ? APP_THEME.shared.warning
      : APP_THEME.shared.success;

  return (
    <View className="gap-3 rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
      <View className="flex-row items-center justify-between gap-3">
        <View>
          <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-slate-400">
            Kalan süre
          </Text>
          <Text className="mt-1 text-lg font-semibold text-white">{seconds} sn</Text>
        </View>

        <ThemeChip tone="night" accent={isUrgent ? 'danger' : 'primary'}>
          <ThemeChipText tone="night" accent={isUrgent ? 'danger' : 'primary'}>
            {isUrgent ? 'Son anlar' : 'Canlı tur'}
          </ThemeChipText>
        </ThemeChip>
      </View>

      <View className="h-2.5 rounded-full bg-white/10 overflow-hidden">
        <Animated.View
          style={{
            height: '100%',
            borderRadius: 999,
            backgroundColor: barColor,
            width: anim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>
    </View>
  );
}
