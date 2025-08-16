import React, { useEffect, useRef, useState } from 'react';
import { Button, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Settings {
  unit: string;
  defaultVolume: number;
  costPerVolume: number;
  currency: string;
  currencySymbol: string;
  weekdayStart: string;
}

interface DayData {
  volume: number;
  cost: number;
}

interface CalendarGridProps {
  month: string;
  calendarData: Record<string, DayData>;
  settings: Settings;
  setCalendarData: (data: Record<string, DayData>) => void;
  colorScheme?: 'light' | 'dark';
}

export default function CalendarGrid({ month, calendarData, settings, setCalendarData, colorScheme = 'light' }: CalendarGridProps) {
  // Parse month string (YYYY-MM)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editVolume, setEditVolume] = useState<string>('');
  const [editCost, setEditCost] = useState<string>('');
  const scrollRef = useRef<ScrollView | null>(null);
  const weekLayouts = useRef<Record<number, number>>({});

  const [year, monthNum] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  let firstDayWeekday = new Date(year, monthNum - 1, 1).getDay();
  if (settings.weekdayStart === 'monday') {
    firstDayWeekday = (firstDayWeekday === 0 ? 6 : firstDayWeekday - 1);
  }

  const openEditModal = (day: number) => {
    const dateKey = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateKey);
    setEditVolume(String(calendarData[dateKey]?.volume ?? settings.defaultVolume));
    setEditCost(String(calendarData[dateKey]?.cost ?? settings.costPerVolume));
  // Scroll the week containing this day into view before opening modal
  scrollToDay(day);
  setModalVisible(true);
  };

  const saveEdit = () => {
    if (!selectedDate) return;
    const newData = { ...calendarData, [selectedDate]: { volume: parseFloat(editVolume) || 0, cost: parseFloat(editCost) || 0 } };
    setCalendarData(newData);
    setModalVisible(false);
  };

  // Theme colors
  const theme = {
    bg: colorScheme === 'dark' ? '#181818' : '#fff',
    fg: colorScheme === 'dark' ? '#eee' : '#222',
    cellBg: colorScheme === 'dark' ? '#222' : '#f9f9f9',
    modalBg: colorScheme === 'dark' ? '#222' : '#fff',
    border: colorScheme === 'dark' ? '#444' : '#ccc',
    cost: 'rgba(116, 238, 68, 1)',
    volume: '#888',
  };
  // Helper to scroll to the week index that contains a given day
  const scrollToDay = (day: number) => {
    const weekIndex = Math.floor((firstDayWeekday + (day - 1)) / 7);
    const tryScroll = (attempt = 0) => {
      const y = weekLayouts.current[weekIndex];
      if (y !== undefined && scrollRef.current) {
        scrollRef.current.scrollTo({ y: Math.max(0, y - 8), animated: true });
      } else if (attempt < 10) {
        setTimeout(() => tryScroll(attempt + 1), 80);
      }
    };
    tryScroll();
  };

  // On mount, if the month includes today, scroll to today's week
  useEffect(() => {
    const today = new Date();
    if (today.getFullYear() === year && (today.getMonth() + 1) === monthNum) {
      scrollToDay(today.getDate());
    }
  }, [month]);

  return (
    <View style={[styles.grid, { backgroundColor: theme.bg }]}> 
      {/* Render header based on weekdayStart */}
      <View style={styles.headerRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Text style={[styles.headerCell, { color: theme.fg }]} key={day}>{day}</Text>
        ))}
      </View>
      {/* Render days for selected month */}
  <ScrollView ref={(r) => { scrollRef.current = r; }} style={styles.daysRow} contentContainerStyle={{ paddingBottom: 20 }}>
        {(() => {
          // Build array of all cells (empty + days)
          const cells = [];
          for (let i = 0; i < firstDayWeekday; i++) {
            cells.push(null);
          }
          for (let d = 1; d <= daysInMonth; d++) {
            cells.push(d);
          }
          // Pad end of last week with empty cells
          while (cells.length % 7 !== 0) {
            cells.push(null);
          }
          // Render weeks
          const weeks = [];
          for (let w = 0; w < cells.length / 7; w++) {
            weeks.push(
              <View
                style={styles.weekRow}
                key={w}
                onLayout={(e) => {
                  weekLayouts.current[w] = e.nativeEvent.layout.y;
                }}
              >
                {cells.slice(w * 7, w * 7 + 7).map((day, i) =>
                  day ? (
                    <TouchableOpacity style={[styles.dayCell, { backgroundColor: theme.cellBg }]} key={i} onPress={() => openEditModal(day)}>
                      <Text style={[styles.dayText, { color: theme.fg }]}>{day}</Text>
                      <Text style={[styles.volume, { color: theme.volume }]}>{(calendarData[`${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`]?.volume ?? settings.defaultVolume)} {settings.unit}</Text>
                      <Text style={[styles.cost, { color: theme.cost }]}>{settings.currencySymbol}{Number(calendarData[`${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`]?.cost ?? settings.costPerVolume).toFixed(2)}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.dayCell, { backgroundColor: theme.cellBg }]} key={i} />
                  )
                )}
              </View>
            );
          }
          return weeks;
        })()}
      </ScrollView>
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.modalBg }]}> 
            <Text style={[styles.modalTitle, { color: theme.fg }]}>{selectedDate ? `${selectedDate}` : ''}</Text>
            <Text style={{ color: theme.fg }}>Volume ({settings.unit}):</Text>
            <TextInput
              style={[styles.input, { color: theme.fg, borderColor: theme.border, backgroundColor: theme.bg }]}
              keyboardType="decimal-pad"
              value={editVolume}
              onChangeText={setEditVolume}
              placeholderTextColor={theme.volume}
            />
            <Text style={{ color: theme.fg }}>Cost ({settings.currencySymbol}):</Text>
            <TextInput
              style={[styles.input, { color: theme.fg, borderColor: theme.border, backgroundColor: theme.bg }]}
              keyboardType="decimal-pad"
              value={editCost}
              onChangeText={setEditCost}
              placeholderTextColor={theme.cost}
            />
            <View style={styles.modalButtons}>
              <Button title="Save" onPress={saveEdit} />
              <Button title="Cancel" onPress={() => setModalVisible(false)} color={theme.volume} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { padding: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  headerCell: { flex: 1, textAlign: 'center', fontWeight: 'bold', color: '#222' },
  daysRow: { },
  weekRow: { flexDirection: 'row' },
  dayCell: { width: '14%', aspectRatio: 1, margin: 2, backgroundColor: '#f9f9f9', alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  dayText: { color: '#222', fontWeight: 'bold' },
  volume: { fontSize: 10, color: '#888' },
  cost: { fontSize: 10, color: '#e44' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 8, width: 300, alignItems: 'center' },
  modalTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, width: '100%', marginVertical: 8, borderRadius: 4 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 16 },
});
