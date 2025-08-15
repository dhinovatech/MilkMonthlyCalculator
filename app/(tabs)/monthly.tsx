import React from 'react';
import MonthlyViewScreen from '../../components/MonthlyViewScreen';
import { AppProvider } from '../../context/AppContext';

export default function MonthlyTab() {
  return (
    <AppProvider>
      <MonthlyViewScreen />
    </AppProvider>
  );
}
