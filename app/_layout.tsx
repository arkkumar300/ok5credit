import { Stack } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/i18n.js';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthProvider from './components/AuthContext.js';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <I18nextProvider i18n={i18n}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="+not-found" />
          </Stack>
        </I18nextProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}