import React, { useContext, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { AppContext, DayData } from '../context/AppContext';
import CalendarGrid from './CalendarGrid';

const getMonthOptions = () => {
  const now = new Date();
  const months = [];
  for (let i = -1; i <= 1; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({
      label: `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`,
      value: `${d.getFullYear()}-${d.getMonth() + 1}`,
    });
  }
  return months;
};

export default function MonthlyViewScreen() {

  const { settings, firstLoad, calendarData, setCalendarData } = useContext(AppContext);
  const [selectedMonth, setSelectedMonth] = useState<string>(getMonthOptions()[1].value);
  const colorScheme = useColorScheme() as 'light' | 'dark';

  // Ensure calendarData for selectedMonth is initialized
  React.useEffect(() => {
    if (firstLoad) return;
    const [year, monthNum] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    if (!calendarData[selectedMonth] || Object.keys(calendarData[selectedMonth]).length === 0) {
      const monthData: Record<number, DayData> = {};
      const today = new Date();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, monthNum - 1, d);
        const applyTo = settings.applyTo ?? 'future';
        if (applyTo === 'future') {
          // Only apply settings to future dates
          if (dateObj >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
            monthData[d] = {
              volume: settings.defaultVolume,
              cost: settings.costPerVolume,
            };
          } else {
            monthData[d] = {
              volume: 0,
              cost: 0,
            };
          }
        } else {
          // Apply to all dates (currentAndFuture)
          monthData[d] = {
            volume: settings.defaultVolume,
            cost: settings.costPerVolume,
          };
        }
      }
      setCalendarData(prev => ({ ...prev, [selectedMonth]: monthData }));
    }
  }, [selectedMonth, calendarData, settings, setCalendarData, firstLoad]);

  // Calculate totals
  const monthDates = Object.values(calendarData[selectedMonth] || {}) as DayData[];
  const totalVolume = monthDates.reduce((sum: number, d: DayData) => sum + (d.volume || 0), 0);
  const totalCost = monthDates.reduce((sum: number, d: DayData) => sum + ((d.volume || 0) * (d.cost || 0)), 0);


  if (firstLoad) {
    return (
      <View style={styles.centered}>
        <Text>Monthly View is disabled until you save settings.</Text>
        <Button title="Go to Settings" onPress={() => Alert.alert('Please save settings first!')} />
      </View>
    );
  }


  const monthOptions = getMonthOptions();
  const currentIndex = monthOptions.findIndex(m => m.value === selectedMonth);
  const goPrevMonth = () => {
    if (currentIndex > 0) setSelectedMonth(monthOptions[currentIndex - 1].value);
  };
  const goNextMonth = () => {
    if (currentIndex < monthOptions.length - 1) setSelectedMonth(monthOptions[currentIndex + 1].value);
  };

  // Theme colors
  const theme = {
    bg: colorScheme === 'dark' ? '#181818' : '#fff',
    fg: colorScheme === 'dark' ? '#eee' : '#222',
    barBg: colorScheme === 'dark' ? '#222' : '#f5f5f5',
    border: colorScheme === 'dark' ? '#444' : '#eee',
  };
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}> 
      <View style={[styles.dropdownRow, { backgroundColor: theme.barBg, borderRadius: 12, margin: 12, padding: 12 }]}> 
        <TouchableOpacity
          style={[styles.monthNavBtn, { backgroundColor: theme.bg, borderColor: theme.border, opacity: currentIndex === 0 ? 0.5 : 1 }]}
          onPress={goPrevMonth}
          disabled={currentIndex === 0}
        >
          <Text style={[styles.monthNavText, { color: theme.fg }]}>←</Text>
        </TouchableOpacity>
        <View style={[styles.monthDropdown, { marginHorizontal: 12 }]}> 
          <RNPickerSelect
            onValueChange={setSelectedMonth}
            items={monthOptions}
            value={selectedMonth}
            style={{ inputIOS: { color: theme.fg, backgroundColor: theme.bg, fontWeight: 'bold', textAlign: 'center', padding: 12, borderRadius: 8 }, inputAndroid: { color: theme.fg, backgroundColor: theme.bg, fontWeight: 'bold', textAlign: 'center', padding: 12, borderRadius: 8 } }}
          />
        </View>
        <TouchableOpacity
          style={[styles.monthNavBtn, { backgroundColor: theme.bg, borderColor: theme.border, opacity: currentIndex === monthOptions.length - 1 ? 0.5 : 1 }]}
          onPress={goNextMonth}
          disabled={currentIndex === monthOptions.length - 1}
        >
          <Text style={[styles.monthNavText, { color: theme.fg }]}>→</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1, backgroundColor: theme.bg }}>
        <CalendarGrid
          month={selectedMonth}
          calendarData={calendarData[selectedMonth] || {}}
          settings={settings}
          setCalendarData={(monthData) => {
            setCalendarData(prev => ({
              ...prev,
              [selectedMonth]: monthData
            }));
          }}
          colorScheme={colorScheme}
        />
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: theme.barBg, borderColor: theme.border }]}> 
        <Text style={[styles.footerText, { color: theme.fg }]}>Total Volume: {totalVolume} {settings.unit}</Text>
        <Text style={[styles.footerText, { color: theme.fg }]}>Total Cost: {settings.currencySymbol}{totalCost.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dropdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16 },
  monthDropdown: { flex: 1, marginHorizontal: 8 },
  monthNavBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  footer: { padding: 16, borderTopWidth: 1 },
  footerText: { fontWeight: 'bold', fontSize: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
