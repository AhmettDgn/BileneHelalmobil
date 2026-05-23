import type { ReactNode } from 'react';
import { Text, View, type TextProps, type ViewProps } from 'react-native';
import { cn } from '@/lib/cn';
import type { ScreenTone } from '@/theme/app-theme';

type PanelVariant = 'default' | 'soft' | 'hero';
type ChipAccent = 'neutral' | 'primary' | 'secondary' | 'danger' | 'success';

const PANEL_CLASSES: Record<ScreenTone, Record<PanelVariant, string>> = {
  warm: {
    default: 'border-accent-rose/20 bg-surface-warm-card',
    soft: 'border-accent-orange/20 bg-surface-warm-soft',
    hero: 'border-accent-rose/25 bg-white',
  },
  night: {
    default: 'border-white/10 bg-surface-night-card',
    soft: 'border-white/10 bg-surface-night-soft',
    hero: 'border-accent-cyan/20 bg-surface-night-elevated',
  },
};

const CHIP_CLASSES: Record<ScreenTone, Record<ChipAccent, string>> = {
  warm: {
    neutral: 'border-accent-rose/[0.15] bg-accent-rose/10',
    primary: 'border-accent-rose/20 bg-accent-rose/[0.15]',
    secondary: 'border-accent-orange/20 bg-accent-orange/[0.15]',
    danger: 'border-state-danger/20 bg-state-danger/10',
    success: 'border-state-success/20 bg-state-success/10',
  },
  night: {
    neutral: 'border-white/10 bg-white/5',
    primary: 'border-accent-cyan/20 bg-accent-cyan/10',
    secondary: 'border-accent-fuchsia/20 bg-accent-fuchsia/10',
    danger: 'border-state-danger/25 bg-state-danger/10',
    success: 'border-state-success/25 bg-state-success/10',
  },
};

const CHIP_TEXT_CLASSES: Record<ScreenTone, Record<ChipAccent, string>> = {
  warm: {
    neutral: 'text-ink-muted',
    primary: 'text-accent-rose',
    secondary: 'text-accent-orange',
    danger: 'text-state-danger',
    success: 'text-state-success',
  },
  night: {
    neutral: 'text-slate-300',
    primary: 'text-accent-cyan',
    secondary: 'text-accent-fuchsia',
    danger: 'text-state-danger',
    success: 'text-state-success',
  },
};

interface ThemePanelProps extends ViewProps {
  children: ReactNode;
  tone: ScreenTone;
  variant?: PanelVariant;
  className?: string;
}

export function ThemePanel({
  children,
  tone,
  variant = 'default',
  className,
  ...props
}: ThemePanelProps) {
  return (
    <View
      className={cn(
        'rounded-[26px] border px-4 py-4',
        PANEL_CLASSES[tone][variant],
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

interface ThemeChipProps extends ViewProps {
  children: ReactNode;
  tone: ScreenTone;
  accent?: ChipAccent;
  className?: string;
}

export function ThemeChip({
  children,
  tone,
  accent = 'neutral',
  className,
  ...props
}: ThemeChipProps) {
  return (
    <View
      className={cn(
        'rounded-full border px-3 py-1.5',
        CHIP_CLASSES[tone][accent],
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

interface ThemeChipTextProps extends TextProps {
  children: ReactNode;
  tone: ScreenTone;
  accent?: ChipAccent;
  className?: string;
}

export function ThemeChipText({
  children,
  tone,
  accent = 'neutral',
  className,
  ...props
}: ThemeChipTextProps) {
  return (
    <Text
      className={cn('text-xs font-semibold uppercase tracking-[1.4px]', CHIP_TEXT_CLASSES[tone][accent], className)}
      {...props}
    >
      {children}
    </Text>
  );
}
