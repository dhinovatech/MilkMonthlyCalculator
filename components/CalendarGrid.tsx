import React, { useState } from 'react';
import { Button, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  calendarData: Record<number, DayData>;
  settings: Settings;
  setCalendarData: (data: Record<number, DayData>) => void;
  colorScheme?: 'light' | 'dark';
}

export default function CalendarGrid({ month, calendarData, settings, setCalendarData, colorScheme = 'light' }: CalendarGridProps) {
  // Parse month string (YYYY-MM)
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editVolume, setEditVolume] = useState<string>('');
  const [editCost, setEditCost] = useState<string>('');

  const [year, monthNum] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  // Get weekday index for first day of month (0=Sunday, 6=Saturday)
  let firstDayWeekday = new Date(year, monthNum - 1, 1).getDay();
  // Adjust for settings.weekdayStart
  if (settings.weekdayStart === 'monday') {
    firstDayWeekday = (firstDayWeekday === 0 ? 6 : firstDayWeekday - 1);
  }

  const openEditModal = (day: number) => {
    setSelectedDay(day);
    setEditVolume(String(calendarData[day]?.volume ?? settings.defaultVolume));
    setEditCost(String(calendarData[day]?.cost ?? settings.costPerVolume));
    setModalVisible(true);
  };

  const saveEdit = () => {
    if (selectedDay == null) return;
    const newData = { ...calendarData, [selectedDay]: { volume: parseFloat(editVolume) || 0, cost: Number(editCost) } };
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
  return (
    <View style={[styles.grid, { backgroundColor: theme.bg }]}> 
      {/* Render header based on weekdayStart */}
      <View style={styles.headerRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Text style={[styles.headerCell, { color: theme.fg }]} key={day}>{day}</Text>
        ))}
      </View>
      {/* Render days for selected month */}
      <View style={styles.daysRow}>
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
              <View style={styles.weekRow} key={w}>
                {cells.slice(w * 7, w * 7 + 7).map((day, i) =>
                  day ? (
                    <TouchableOpacity style={[styles.dayCell, { backgroundColor: theme.cellBg }]} key={i} onPress={() => openEditModal(day)}>
                      <Text style={[styles.dayText, { color: theme.fg }]}>{day}</Text>
                      <Text style={[styles.volume, { color: theme.volume }]}>{(calendarData[day]?.volume ?? settings.defaultVolume)} {settings.unit}</Text>
                      <Text style={[styles.cost, { color: theme.cost }]}>{settings.currencySymbol}{Number(calendarData[day]?.cost ?? settings.costPerVolume).toFixed(2)}</Text>
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
      </View>
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.modalBg }]}> 
            <Text style={[styles.modalTitle, { color: theme.fg }]}>{selectedDay ? `${selectedDay} ${new Date(year, monthNum - 1, selectedDay).toLocaleString('default', { month: 'short' })} ${year}` : ''}</Text>
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
              keyboardType="numeric"
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
