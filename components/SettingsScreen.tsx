import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { AppContext } from '../context/AppContext';

const currencyOptions = [
  { label: 'INR (₹)', value: 'INR' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'Pounds (£)', value: 'GBP' },
  { label: 'Euro (€)', value: 'EUR' },
];
const unitOptions = [
  { label: 'Litre', value: 'litre' },
  { label: 'Ounce', value: 'ounce' },
];
const weekdayOptions = [
  { label: 'Sunday', value: 'sunday' },
  { label: 'Monday', value: 'monday' },
];
const applyOptions = [
  { label: 'Only Future Days', value: 'future' },
  { label: 'Current Month and Future Days', value: 'currentAndFuture' },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme() as 'light' | 'dark';
  const { settings, setSettings, firstLoad, setFirstLoad, updateCalendarData } = useContext(AppContext);
  const [localSettings, setLocalSettings] = useState(settings);
  // Use localSettings.applyTo for picker value

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const saveSettings = async () => {
  setSettings(localSettings);
  await AsyncStorage.setItem('settings', JSON.stringify(localSettings));
  if (firstLoad) setFirstLoad(false);
  else updateCalendarData(localSettings.applyTo ?? 'future', localSettings);
  Alert.alert('Settings Saved');
  };

  const theme = {
    bg: colorScheme === 'dark' ? '#181818' : '#fff',
    fg: colorScheme === 'dark' ? '#fff' : '#222',
    inputBg: colorScheme === 'dark' ? '#222' : '#fff',
    border: colorScheme === 'dark' ? '#444' : '#ccc',
    button: colorScheme === 'dark' ? '#444' : '#007AFF',
    label: colorScheme === 'dark' ? '#fff' : '#222',
  };
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}> 
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Banner Ad Placeholder */}
        <View style={styles.bannerAd}><Text style={{ color: theme.fg }}>Banner Ad Here</Text></View>
        <Text style={[styles.label, { color: theme.label }]}>Default Daily Milk Volume Unit</Text>
        <View style={styles.pickerWrap}>
          <RNPickerSelect
            onValueChange={value => setLocalSettings({ ...localSettings, unit: value })}
            items={unitOptions}
            value={localSettings.unit}
            style={{ inputIOS: { color: theme.fg, backgroundColor: theme.inputBg, padding: 12, borderRadius: 8 }, inputAndroid: { color: theme.fg, backgroundColor: theme.inputBg, padding: 12, borderRadius: 8 } }}
          />
        </View>
        <Text style={[styles.label, { color: theme.label }]}>Default Milk Volume</Text>
        <TextInput
          style={[styles.input, { color: theme.fg, backgroundColor: theme.inputBg, borderColor: theme.border }]}
          keyboardType="decimal-pad"
          value={String(localSettings.defaultVolume)}
          onChangeText={value => setLocalSettings({ ...localSettings, defaultVolume: parseFloat(value) || 0 })}
          placeholderTextColor={theme.fg}
        />
        <Text style={[styles.label, { color: theme.label }]}>Cost per Volume</Text>
        <TextInput
          style={[styles.input, { color: theme.fg, backgroundColor: theme.inputBg, borderColor: theme.border }]}
          keyboardType="numeric"
          value={String(localSettings.costPerVolume)}
          onChangeText={value => setLocalSettings({ ...localSettings, costPerVolume: Number(value) })}
          placeholderTextColor={theme.fg}
        />
        <Text style={[styles.label, { color: theme.label }]}>Currency</Text>
        <View style={styles.pickerWrap}>
          <RNPickerSelect
            onValueChange={value => setLocalSettings({ ...localSettings, currency: value })}
            items={currencyOptions}
            value={localSettings.currency}
            style={{ inputIOS: { color: theme.fg, backgroundColor: theme.inputBg, padding: 12, borderRadius: 8 }, inputAndroid: { color: theme.fg, backgroundColor: theme.inputBg, padding: 12, borderRadius: 8 } }}
          />
        </View>
        <Text style={[styles.label, { color: theme.label }]}>Weekday Starts On</Text>
        <View style={styles.pickerWrap}>
          <RNPickerSelect
            onValueChange={value => setLocalSettings({ ...localSettings, weekdayStart: value })}
            items={weekdayOptions}
            value={localSettings.weekdayStart}
            style={{ inputIOS: { color: theme.fg, backgroundColor: theme.inputBg, padding: 12, borderRadius: 8 }, inputAndroid: { color: theme.fg, backgroundColor: theme.inputBg, padding: 12, borderRadius: 8 } }}
          />
        </View>
        {!firstLoad && (
          <>
            <Text style={[styles.label, { color: theme.label }]}>Apply Settings To</Text>
            <View style={styles.pickerWrap}>
              <RNPickerSelect
                onValueChange={value => setLocalSettings({ ...localSettings, applyTo: value })}
                items={applyOptions}
                value={localSettings.applyTo ?? 'future'}
                style={{ inputIOS: { color: theme.fg, backgroundColor: theme.inputBg, padding: 12, borderRadius: 8 }, inputAndroid: { color: theme.fg, backgroundColor: theme.inputBg, padding: 12, borderRadius: 8 } }}
              />
            </View>
          </>
        )}
        <View style={styles.buttonWrap}>
          <Button title="Save Settings" onPress={saveSettings} color={theme.button} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { marginTop: 18, marginBottom: 6, fontWeight: 'bold', fontSize: 16 },
  input: { borderWidth: 1, padding: 12, marginBottom: 16, borderRadius: 8 },
  pickerWrap: { marginBottom: 16, borderRadius: 8, overflow: 'hidden' },
  buttonWrap: { marginVertical: 24 },
  bannerAd: { marginTop: 32, alignItems: 'center' },
});
