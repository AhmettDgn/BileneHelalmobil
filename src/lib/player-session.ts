import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PlayerSession {
  participantId: string;
  gameSessionId: string;
  displayName: string;
  isAuthenticated: boolean;
}

function key(gamePin: string) {
  return `bilenehalal:player-session:${gamePin}`;
}

export async function savePlayerSession(gamePin: string, session: PlayerSession): Promise<void> {
  await AsyncStorage.setItem(key(gamePin), JSON.stringify(session));
}

export async function loadPlayerSession(gamePin: string): Promise<PlayerSession | null> {
  const raw = await AsyncStorage.getItem(key(gamePin));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlayerSession;
  } catch {
    return null;
  }
}

export async function clearPlayerSession(gamePin: string): Promise<void> {
  await AsyncStorage.removeItem(key(gamePin));
}
