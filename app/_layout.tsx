import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

import { AppProvider, useStore } from '@/store/AppStore';
import { ThemeProvider, useTheme } from '@/ui/theme';
import { SplashLogo } from '@/ui/SplashLogo';

SplashScreen.preventAutoHideAsync().catch(() => {});

function ThemedApp() {
  const { settings } = useStore();
  const os = useColorScheme();
  const resolved = settings.theme === 'system' ? (os === 'light' ? 'light' : 'dark') : settings.theme;
  return (
    <ThemeProvider resolvedMode={resolved}>
      <ThemedStack />
    </ThemeProvider>
  );
}

function ThemedStack() {
  const { colors, mode } = useTheme();
  return (
    <>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  // Keep the branded logo up a touch longer so it reads as a launch screen.
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 1100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  const ready = fontsLoaded && minTimePassed;

  return (
    <SafeAreaProvider>
      <AppProvider>
        <ThemedApp />
      </AppProvider>
      {ready ? null : <SplashLogo />}
    </SafeAreaProvider>
  );
}
