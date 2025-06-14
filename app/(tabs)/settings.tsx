import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const SETTINGS_KEY = 'app_settings';

export default function SettingsScreen() {
  const [currency, setCurrency] = useState('₹');
  const [milkUnit, setMilkUnit] = useState('L');
  const [milkRate, setMilkRate] = useState('60');
  const [milkQuantity, setMilkQuantity] = useState('1.25');
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
        if (jsonValue != null) {
          const settings = JSON.parse(jsonValue);
          setCurrency(settings.currency || '₹');
          setMilkUnit(settings.milkUnit || 'L');
          setMilkRate(settings.milkRate || '60');
          setMilkQuantity(settings.milkQuantity || '1.25');
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Save settings
  const saveSettings = async () => {
    try {
      const settings = { currency, milkUnit, milkRate, milkQuantity };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      Alert.alert('Success', 'Settings saved!');
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  if (loading) {
    return <ThemedView style={styles.container}><ThemedText>Loading...</ThemedText></ThemedView>;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Currency</ThemedText>
      <Picker
        selectedValue={currency}
        onValueChange={setCurrency}
        style={styles.picker}>
        <Picker.Item label="INR" value="₹" />
        <Picker.Item label="USD" value="$" />
        <Picker.Item label="EUR" value="€" />
        <Picker.Item label="GBP" value="£" />
      </Picker>

      <ThemedText type="subtitle">Milk Volume Unit</ThemedText>
      <Picker
        selectedValue={milkUnit}
        onValueChange={setMilkUnit}
        style={styles.picker}>
        <Picker.Item label="Litre (L)" value="L" />
        <Picker.Item label="Millilitre (ml)" value="ml" />
        <Picker.Item label="Gallon (gal)" value="gal" />
      </Picker>

      <ThemedText type="subtitle">Default Milk Rate</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Enter milk rate"
        keyboardType="numeric"
        value={milkRate}
        onChangeText={setMilkRate}
      />

      <ThemedText type="subtitle">Default Milk Quantity</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Enter milk quantity"
        keyboardType="numeric"
        value={milkQuantity}
        onChangeText={setMilkQuantity}
      />

      <Button title="Save Settings" onPress={saveSettings} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 50,
    gap: 16,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
  },
});