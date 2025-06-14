import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const SETTINGS_KEY = 'app_settings';
const MILK_DATA_KEY = 'milk_data';

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(month: number, year: number) {
  return new Date(year, month, 1).getDay();
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MilkCalendarScreen() {
  const today = new Date();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [settings, setSettings] = useState<{ currency: string; milkRate: string; milkQuantity: string; milkUnit?: string }>({ currency: 'USD', milkRate: '', milkQuantity: '', milkUnit: 'L' });
  const [milkData, setMilkData] = useState<Record<string, { quantity: string; price: string }>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [inputQuantity, setInputQuantity] = useState('');
  const [inputPrice, setInputPrice] = useState('');

  // Load settings and milk data
  useEffect(() => {
    (async () => {
      const settingsValue = await AsyncStorage.getItem(SETTINGS_KEY);
      if (settingsValue) setSettings(JSON.parse(settingsValue));
      const milkValue = await AsyncStorage.getItem(MILK_DATA_KEY);
      if (milkValue) setMilkData(JSON.parse(milkValue));
    })();
  }, []);

  // Save milk data when changed
  useEffect(() => {
    AsyncStorage.setItem(MILK_DATA_KEY, JSON.stringify(milkData));
  }, [milkData]);

  // Autosave current month if not saved
  useEffect(() => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    let shouldSave = false;
    const newMilkData = { ...milkData };
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${selectedYear}-${selectedMonth + 1}-${day}`;
      if (!milkData[dateKey]) {
        newMilkData[dateKey] = {
          quantity: settings.milkQuantity || '',
          price: settings.milkRate || '',
        };
        shouldSave = true;
      }
    }
    if (shouldSave) {
      setMilkData(newMilkData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, settings.milkQuantity, settings.milkRate]);

  // Find all saved months
  const savedMonthsSet = useMemo(() => {
    const set = new Set<string>();
    Object.keys(milkData).forEach(dateKey => {
      const [year, month] = dateKey.split('-');
      set.add(`${year}-${month}`);
    });
    return set;
  }, [milkData]);

  // Build allowed months: saved months, current month, and one month in future
  const allowedMonthYearPairs = useMemo(() => {
    const pairs: { year: number; month: number }[] = [];
    // Add all saved months
    savedMonthsSet.forEach(ym => {
      const [year, month] = ym.split('-').map(Number);
      pairs.push({ year, month: month - 1 });
    });
    // Add current month
    pairs.push({ year: today.getFullYear(), month: today.getMonth() });
    // Add one month in future
    let nextMonth = today.getMonth() + 1;
    let nextYear = today.getFullYear();
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    pairs.push({ year: nextYear, month: nextMonth });
    // Remove duplicates
    const unique = new Map<string, { year: number; month: number }>();
    pairs.forEach(({ year, month }) => {
      unique.set(`${year}-${month}`, { year, month });
    });
    // Sort by year and month
    return Array.from(unique.values()).sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month
    );
  }, [savedMonthsSet, today]);

  // Only show days for the current (selected) month
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const firstDayOfWeek = getFirstDayOfWeek(selectedMonth, selectedYear);

  // Build calendar grid
  const calendarRows: Array<Array<number | null>> = [];
  let week: Array<number | null> = Array(firstDayOfWeek).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      calendarRows.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    calendarRows.push(week);
  }

  // Compute totals
  const { totalQuantity, totalAmount } = useMemo(() => {
    let totalQuantity = 0;
    let totalAmount = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${selectedYear}-${selectedMonth + 1}-${day}`;
      const entry = milkData[dateKey];
      const quantity = parseFloat(entry?.quantity || settings.milkQuantity || '0') || 0;
      const price = parseFloat(entry?.price || settings.milkRate || '0') || 0;
      totalQuantity += quantity;
      totalAmount += quantity * price;
    }
    return { totalQuantity, totalAmount };
  }, [milkData, selectedMonth, selectedYear, settings, daysInMonth]);

  const handleDatePress = (day: number | null) => {
    if (!day) return;
    const dateKey = `${selectedYear}-${selectedMonth + 1}-${day}`;
    setSelectedDate(dateKey);
    setInputQuantity(milkData[dateKey]?.quantity || settings.milkQuantity || '');
    setInputPrice(milkData[dateKey]?.price || settings.milkRate || '');
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!selectedDate) return;
    setMilkData(prev => ({
      ...prev,
      [selectedDate]: { quantity: inputQuantity, price: inputPrice }
    }));
    setModalVisible(false);
  };

  const handlePrevMonth = () => {
    const idx = allowedMonthYearPairs.findIndex(
      p => p.year === selectedYear && p.month === selectedMonth
    );
    if (idx > 0) {
      setSelectedYear(allowedMonthYearPairs[idx - 1].year);
      setSelectedMonth(allowedMonthYearPairs[idx - 1].month);
    }
  };

  const handleNextMonth = () => {
    const idx = allowedMonthYearPairs.findIndex(
      p => p.year === selectedYear && p.month === selectedMonth
    );
    if (idx < allowedMonthYearPairs.length - 1) {
      setSelectedYear(allowedMonthYearPairs[idx + 1].year);
      setSelectedMonth(allowedMonthYearPairs[idx + 1].month);
    }
  };

  // Only show quantity if price matches settings, else show all details
const renderDayCell = (day: number | null, colIdx: number) => {
  if (!day) return <View style={[styles.dayCell, { backgroundColor: themeColors.background }]} key={colIdx} />;
  const dateKey = `${selectedYear}-${selectedMonth + 1}-${day}`;
  const milkEntry = milkData[dateKey];
  const quantity = milkEntry?.quantity || settings.milkQuantity || '';
  const price = milkEntry?.price || settings.milkRate || '';
  const cost = (parseFloat(quantity) || 0) * (parseFloat(price) || 0);
  const unit = settings.milkUnit || 'L';
  const showOnlyQuantity = price === settings.milkRate;

  return (
    <TouchableOpacity
      style={[
        styles.dayCell,
        { backgroundColor: colorScheme === 'dark' ? '#23272b' : '#f5fafd' }
      ]}
      key={colIdx}
      onPress={() => handleDatePress(day)}
      activeOpacity={0.8}
    >
      <Text style={[styles.dayNumber, { color: themeColors.text }]}>{day}</Text>
      <View style={styles.milkRow}>        
        <Text style={[styles.milkQty, { color: themeColors.tint }]}>
          {quantity} {unit}
        </Text>
      </View>
      {!showOnlyQuantity && (
        <>
          <Text style={[styles.milkRate, { color: themeColors.icon }]}>
            {price ? `@ ${settings.currency} ${price}/${unit}` : ''}
          </Text>
          <Text style={[styles.milkCost, { color: themeColors.icon }]}>
            {cost > 0 ? `${settings.currency} ${cost.toFixed(2)}` : ''}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

  return (
    <ThemedView style={styles.container}>
      {/* Month and Year Picker with arrows */}
      <View style={styles.pickerRow}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBtn}>
          <Ionicons name="chevron-back" size={24} color={themeColors.tint} />
        </TouchableOpacity>
        <Picker
          selectedValue={selectedMonth}
          style={[styles.picker, { color: themeColors.text }]}
          onValueChange={m => setSelectedMonth(Number(m))}
          dropdownIconColor={themeColors.tint}
        >
          {allowedMonthYearPairs
            .filter(pair => pair.year === selectedYear)
            .map(pair => (
              <Picker.Item
                label={months[pair.month]}
                value={pair.month}
                key={`${pair.year}-${pair.month}`}
                color={themeColors.text}
              />
            ))}
        </Picker>
        <Picker
          selectedValue={selectedYear}
          style={[styles.picker, { color: themeColors.text }]}
          onValueChange={y => setSelectedYear(Number(y))}
          dropdownIconColor={themeColors.tint}
        >
          {Array.from(new Set(allowedMonthYearPairs.map(pair => pair.year))).map(year => (
            <Picker.Item label={year.toString()} value={year} key={year} color={themeColors.text} />
          ))}
        </Picker>
        <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBtn}>
          <Ionicons name="chevron-forward" size={24} color={themeColors.tint} />
        </TouchableOpacity>
      </View>

      {/* Calendar Grid in ScrollView */}
      <ScrollView style={styles.calendarScroll} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Weekday header */}
        <View style={styles.weekHeaderRow}>
          {weekDays.map((wd, idx) => (
            <Text key={wd} style={[styles.weekHeaderText, { color: themeColors.icon }]}>
              {wd}
            </Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {calendarRows.map((week, rowIdx) => (
            <View style={styles.weekRow} key={rowIdx}>
              {week.map(renderDayCell)}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Totals */}
      <View style={styles.totalsRow}>
        <ThemedText type="subtitle">
          Total: {totalQuantity.toFixed(2)} {settings.milkUnit || 'L'}
        </ThemedText>
        <ThemedText type="subtitle">
          {settings.currency} {totalAmount.toFixed(2)}
        </ThemedText>
      </View>

      {/* Modal for editing milk data */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.background }]}>
            <ThemedText type="subtitle">Edit Milk Entry</ThemedText>
            <Text style={{ marginBottom: 8, color: themeColors.text }}>{selectedDate}</Text>
            <Text style={{ color: themeColors.text }}>Milk Quantity</Text>
            <TextInput
              style={[styles.input, { color: themeColors.text, borderColor: themeColors.icon }]}
              keyboardType="numeric"
              value={inputQuantity}
              onChangeText={setInputQuantity}
              placeholder="Quantity"
              placeholderTextColor={themeColors.icon}
            />
            <Text style={{ color: themeColors.text }}>Milk Price ({settings.currency})</Text>
            <TextInput
              style={[styles.input, { color: themeColors.text, borderColor: themeColors.icon }]}
              keyboardType="numeric"
              value={inputPrice}
              onChangeText={setInputPrice}
              placeholder="Price"
              placeholderTextColor={themeColors.icon}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={handleSave} style={{ flex: 1, marginRight: 8 }}>
                <View style={{ backgroundColor: themeColors.tint, padding: 10, borderRadius: 6 }}>
                  <Text style={{ color: '#fff', textAlign: 'center' }}>Save</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ flex: 1 }}>
                <View style={{ backgroundColor: themeColors.icon, padding: 10, borderRadius: 6 }}>
                  <Text style={{ color: '#fff', textAlign: 'center' }}>Cancel</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginBottom: 8,
    marginTop: 20,
    maxHeight: '10%',
  },
  arrowBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  picker: {
    flex: 1,
    height: '100%',
  },
  calendarScroll: {
    flex: 1,
    minHeight: 200,
    maxHeight: '80%',
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 13,
  },
  calendarGrid: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    margin: 2,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 8,
    minWidth: 44,
    minHeight: 90,
    elevation: 1,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  milkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  milkQty: {
    fontSize: 12,
    fontWeight: '600',
  },
  milkCost: {
    fontSize: 12,
    marginTop: 2,
  },
  milkRate: {
    fontSize: 12,
    marginTop: 2,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    marginTop: 8,
    borderColor: '#e0e0e0',
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#0008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: 300,
    elevation: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
});