# Expo UI Revamp Compatibility Notes

## Current Project Snapshot
- Date checked: 2026-05-23
- Current mobile stack:
  - `expo@54.0.0`
  - `react-native@0.81.5`
  - `react@19.1.0`
  - `react-native-web@0.21.0`

## Expo SDK 56 Reference Snapshot
- Source: https://docs.expo.dev/versions/v56.0.0/
- Expo SDK 56 targets:
  - React Native `0.85`
  - React `19.2.3`
  - React Native Web `0.21.0`
  - Minimum Node.js `22.13.x`

## Safe To Use In This UI Revamp Without Upgrading SDK
- Screen-level `StatusBar` styling with `expo-status-bar`
- Root background updates with `expo-system-ui`
- Layered `View` backgrounds and NativeWind-based glass panels
- Existing `expo-router` stacks and route structure

## Explicitly Deferred For A Later SDK Upgrade
- Upgrading Expo from SDK 54 to SDK 56
- Adding `expo-linear-gradient` just for decorative backgrounds
- Adopting newer Expo UI packages such as `@expo/ui`
- Depending on SDK 56-only behavior changes during this redesign

## Practical Decision
- This redesign stays on the current Expo 54 base.
- Visual parity with the reference app is approximated with NativeWind, layered surfaces, and per-screen system UI handling.
- Any future SDK 56 migration should be treated as a separate task because it changes the React Native and Node baselines, not just the UI layer.

## Reference Links
- Expo SDK 56: https://docs.expo.dev/versions/v56.0.0/
- Expo StatusBar 56: https://docs.expo.dev/versions/v56.0.0/sdk/status-bar/
- Expo SystemUI 56: https://docs.expo.dev/versions/v56.0.0/sdk/system-ui/
- Expo LinearGradient 56: https://docs.expo.dev/versions/v56.0.0/sdk/linear-gradient/
