import type { StatusBarStyle } from 'expo-status-bar';

export type ScreenTone = 'warm' | 'night';

export const APP_THEME = {
  warm: {
    root: '#f5eee7',
    panel: '#fffaf6',
    panelSoft: '#fff4ec',
    text: '#2d3348',
    muted: '#7b6f73',
    primary: '#c47d8e',
    secondary: '#e07840',
    indicator: '#c47d8e',
    statusBar: 'dark' as StatusBarStyle,
  },
  night: {
    root: '#060816',
    panel: '#121930',
    panelSoft: '#0d1327',
    text: '#f3f8ff',
    muted: '#9fb0c9',
    primary: '#22d3ee',
    secondary: '#f0abfc',
    indicator: '#67e8f9',
    statusBar: 'light' as StatusBarStyle,
  },
  shared: {
    success: '#34d399',
    warning: '#f59e0b',
    danger: '#fb7185',
  },
} as const;
