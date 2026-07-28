import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FinanceProvider } from '../src/hooks/useFinance';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

SplashScreen.preventAutoHideAsync();

const BACKGROUND_TASK = 'UPDATE_BADGE_COUNT';
TaskManager.defineTask(BACKGROUND_TASK, async () => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Notifications.setBadgeCountAsync(scheduled.length);
});

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (appReady) SplashScreen.hideAsync();
  }, [appReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GluestackUIProvider config={config}>
          <FinanceProvider onReady={() => setAppReady(true)}>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(public)" />
              <Stack.Screen name="(app)" />
            </Stack>
          </FinanceProvider>
        </GluestackUIProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
