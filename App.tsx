import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import MonthlyViewScreen from './components/MonthlyViewScreen';
import SettingsScreen from './components/SettingsScreen';
import { AppProvider } from './context/AppContext';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen name="Monthly View" component={MonthlyViewScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
      {/* Interstitial Ad Placeholder: Show every 30 seconds */}
    </AppProvider>
  );
}
