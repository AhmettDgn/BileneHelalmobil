import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/features/auth/AuthProvider';

export default function AuthLayout() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      router.replace('/(dashboard)');
    }
  }, [session, loading]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
