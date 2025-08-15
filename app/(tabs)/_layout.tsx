
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { AppProvider } from '../../context/AppContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
