import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { PendingScreen } from '@/features/pending/PendingScreen';
import { LedgerScreen } from '@/features/ledger/LedgerScreen';
import { CategoriesScreen } from '@/features/categories/CategoriesScreen';
import { ManualEntryScreen } from '@/features/ledger/ManualEntryScreen';
import { CategoryDrillScreen } from '@/features/dashboard/CategoryDrillScreen';

const Tab = createBottomTabNavigator();

function DashboardStack() {
  const [drillCategory, setDrillCategory] = React.useState<string | null>(null);
  const [periodKind, setPeriodKind] = React.useState<'month' | 'week'>('month');
  const [anchor, setAnchor] = React.useState(Date.now());
  if (drillCategory) {
    return <CategoryDrillScreen categoryId={drillCategory} onBack={() => setDrillCategory(null)} periodKind={periodKind} anchor={anchor} />;
  }
  return <DashboardScreen onDrillCategory={setDrillCategory} periodKind={periodKind} onSetPeriodKind={setPeriodKind} anchor={anchor} onSetAnchor={setAnchor} />;
}

function LedgerStack() {
  const [showManual, setShowManual] = React.useState(false);
  if (showManual) {
    return <ManualEntryScreen onSaved={() => setShowManual(false)} />;
  }
  return <LedgerScreen onAddEntry={() => setShowManual(true)} />;
}

export function RootNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Pending" component={PendingScreen} />
      <Tab.Screen name="Ledger" options={{ headerRight: () => null }} listeners={({ navigation }) => ({
        tabPress: (e) => { navigation.navigate('Ledger'); },
      })}>
        {() => <LedgerStack />}
      </Tab.Screen>
      <Tab.Screen name="Categories" component={CategoriesScreen} />
    </Tab.Navigator>
  );
}
