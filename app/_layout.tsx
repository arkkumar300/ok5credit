// import "../hooks/firebase";  // Ensure Firebase initializes first
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/i18n.js'; // import your i18n config
import { SafeAreaProvider } from 'react-native-safe-area-context';
import  AuthProvider  from './components/AuthContext'; // Import AuthProvider

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
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
