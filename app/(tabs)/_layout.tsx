
import AdManager from '@/components/AdManager';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { AppProvider } from '../../context/AppContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // AdManager centralizes AdMob runtime handling. If expo-ads-admob isn't installed AdManager degrades gracefully.

  const appState = useRef(AppState.currentState);
  const [isAppActive, setIsAppActive] = useState<boolean>(appState.current === 'active');

  // Application-level interstitial: prepare and periodically show when app is active
  useEffect(() => {
    let intervalId: NodeJS.Timeout | number | null = null;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const wasActive = appState.current === 'active';
      appState.current = nextAppState;
      const nowActive = nextAppState === 'active';
      setIsAppActive(nowActive);
      // If app became active, we can (re)start the ad interval
      if (!wasActive && nowActive) {
        startInterval();
      } else if (wasActive && !nowActive) {
        stopInterval();
      }
    };

    const startInterval = () => {
      if (intervalId) return;
      if (Platform.OS === 'web' || !AdManager) return;
      // Prepare interstitial and schedule showing every 90s
      intervalId = setInterval(async () => {
        try {
          await AdManager.prepareAndShowInterstitial();
        } catch (e) {
          // ignore ad errors
        }
      }, 90 * 1000);
    };

    const stopInterval = () => {
      if (intervalId) {
        clearInterval(intervalId as any);
        intervalId = null;
      }
    };

    const setup = async () => {
      try {
        if (Platform.OS !== 'web') {
          await AdManager.setupAdMobTestDevice();
          startInterval();
        }
      } catch (e) {
        // ignore setup errors
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    setup();
    return () => {
      stopInterval();
      subscription.remove();
      try {
        // AdManager will gracefully handle dismissals if supported
        // no-op here
      } catch (e) {}
    };
  }, []);

  return (
    <AppProvider>
      <Tabs
      initialRouteName="monthly"
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        <Tabs.Screen
          name="monthly"
          options={{
            title: 'Monthly View',
            tabBarIcon: () => <IconSymbol size={28} name="calendar" color="#fff" />, 
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: () => <IconSymbol size={28} name="gearshape" color="#fff" />, 
          }}
        />
      </Tabs>
    </AppProvider>
  );
}
