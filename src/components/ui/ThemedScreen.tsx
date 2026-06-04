import { useEffect, type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useColorScheme } from 'nativewind';
import { cn } from '@/lib/cn';
import { APP_THEME, type ScreenTone } from '@/theme/app-theme';

interface ThemedScreenProps extends ViewProps {
  children: ReactNode;
  tone: ScreenTone;
  className?: string;
  contentClassName?: string;
}

export function ThemedScreen({
  children,
  tone,
  className,
  contentClassName,
  ...props
}: ThemedScreenProps) {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(tone === 'warm' ? 'light' : 'dark');
    void SystemUI.setBackgroundColorAsync(APP_THEME[tone].root);
  }, [tone, setColorScheme]);

  const isWarm = tone === 'warm';

  return (
    <SafeAreaView
      className={cn('flex-1', isWarm ? 'bg-surface-warm' : 'bg-surface-night', className)}
      {...props}
    >
      <StatusBar style={APP_THEME[tone].statusBar} />
      <View className="flex-1 overflow-hidden">
        <View pointerEvents="none" className="absolute inset-0">
          <View
            className={cn(
              'absolute h-56 w-56 rounded-full',
              isWarm ? 'bg-accent-rose/[0.15] -left-14 -top-10' : 'bg-accent-cyan/[0.15] -left-20 -top-16'
            )}
          />
          <View
            className={cn(
              'absolute h-52 w-52 rounded-full',
              isWarm ? 'bg-accent-orange/[0.15] -right-10 top-10' : 'bg-accent-fuchsia/[0.12] -right-12 top-8'
            )}
          />
          <View
            className={cn(
              'absolute h-64 w-64 rounded-full',
              isWarm ? 'bg-accent-rose/10 left-16 -bottom-24' : 'bg-blue-400/10 right-4 -bottom-28'
            )}
          />
        </View>
        <View className={cn('flex-1', contentClassName)}>{children}</View>
      </View>
    </SafeAreaView>
  );
}
