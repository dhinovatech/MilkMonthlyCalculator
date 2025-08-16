import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useEffect, useState } from 'react';


export interface Settings {
  unit: string;
  defaultVolume: number;
  costPerVolume: number;
  currency: string;
  currencySymbol: string;
  weekdayStart: string;
  applyTo?: 'future' | 'currentAndFuture';
}

export interface DayData {
  volume: number;
  cost: number;
}

 export type CalendarData = Record<string, Record<string, DayData>>;

const defaultSettings: Settings = {
  unit: 'litre',
  defaultVolume: 1,
  costPerVolume: 1,
  currency: 'INR',
  currencySymbol: '₹',
  weekdayStart: 'sunday',
  applyTo: 'future',
};

export interface AppContextType {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  firstLoad: boolean;
  setFirstLoad: React.Dispatch<React.SetStateAction<boolean>>;
  calendarData: CalendarData;
  setCalendarData: React.Dispatch<React.SetStateAction<CalendarData>>;
  updateCalendarData: (tenure: string, newSettings: Settings) => void;
}

export const AppContext = createContext<AppContextType>({
  settings: defaultSettings,
  setSettings: () => {},
  firstLoad: true,
  setFirstLoad: () => {},
  calendarData: {},
  setCalendarData: () => {},
  updateCalendarData: () => {},
});

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [firstLoad, setFirstLoad] = useState<boolean>(true);
  const [calendarData, setCalendarData] = useState<CalendarData>({});

  useEffect(() => {
    (async () => {
      const s = await AsyncStorage.getItem('settings');
      if (s) {
        setSettings(JSON.parse(s));
        setFirstLoad(false);
      }
      const c = await AsyncStorage.getItem('calendarData');
      if (c) setCalendarData(JSON.parse(c));
    })();
  }, []);

  const updateCalendarData = (tenure: string, newSettings: Settings) => {
    // Get today's date
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-based
    const currentDay = today.getDate();

    setCalendarData(prevData => {
      const updatedData: CalendarData = { ...prevData };
      Object.keys(updatedData).forEach(monthKey => {
        // monthKey format: 'YYYY-M' or 'YYYY-MM'
        const [yearStr, monthStr] = monthKey.split('-');
        const year = Number(yearStr);
        const month = Number(monthStr);
        const daysInMonth = new Date(year, month, 0).getDate();
        const monthData = { ...updatedData[monthKey] } as Record<string, DayData>;

        if (tenure === 'future') {
          // Update all days in future months, and days after today in current month
          if (year > currentYear || (year === currentYear && month > currentMonth)) {
            // All days in future months
            for (let day = 1; day <= daysInMonth; day++) {
              const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              monthData[dateKey] = {
                volume: newSettings.defaultVolume,
                cost: newSettings.costPerVolume,
              };
            }
          } else if (year === currentYear && month === currentMonth) {
            // Only days after today in current month
            for (let day = currentDay + 1; day <= daysInMonth; day++) {
              const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              monthData[dateKey] = {
                volume: newSettings.defaultVolume,
                cost: newSettings.costPerVolume,
              };
            }
          }
        } else if (tenure === 'currentAndFuture') {
          // Update all days in current month and all days in future months
          if (year === currentYear && month === currentMonth) {
            for (let day = 1; day <= daysInMonth; day++) {
              const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              monthData[dateKey] = {
                volume: newSettings.defaultVolume,
                cost: newSettings.costPerVolume,
              };
            }
          } else if (year > currentYear || (year === currentYear && month > currentMonth)) {
            for (let day = 1; day <= daysInMonth; day++) {
              const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              monthData[dateKey] = {
                volume: newSettings.defaultVolume,
                cost: newSettings.costPerVolume,
              };
            }
          }
        }
        updatedData[monthKey] = monthData;
      });
      return updatedData;
    });
  };

  useEffect(() => {
    AsyncStorage.setItem('calendarData', JSON.stringify(calendarData));
  }, [calendarData]);

  return (
    <AppContext.Provider value={{ settings, setSettings, firstLoad, setFirstLoad, calendarData, setCalendarData, updateCalendarData }}>
      {children}
    </AppContext.Provider>
  );
};
