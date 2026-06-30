import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme/ThemeContext';
import {
  DashboardIcon,
  PendingIcon,
  LedgerIcon,
  CategoriesIcon,
  LightIcon,
  DarkIcon,
} from '@/components/UI/TabIcons';
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
  const [refreshKey, setRefreshKey] = React.useState(0);
  const onSaved = React.useCallback(() => { setRefreshKey(k => k + 1); setShowManual(false); }, []);
  if (showManual) {
    return <ManualEntryScreen onSaved={onSaved} />;
  }
  return <LedgerScreen onAddEntry={() => setShowManual(true)} refreshKey={refreshKey} />;
}

function ThemeToggleScreen() {
  return <View style={{ flex: 1 }} />;
}

export function RootNavigator() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#4da6ff' : '#007AFF',
        tabBarInactiveTintColor: isDark ? '#777' : '#999',
        tabBarStyle: {
          backgroundColor: isDark ? '#1e1e1e' : '#fff',
          borderTopColor: isDark ? '#333' : '#eee',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{ tabBarIcon: ({ color, size }) => <DashboardIcon color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Pending"
        component={PendingScreen}
        options={{ tabBarIcon: ({ color, size }) => <PendingIcon color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Ledger"
        options={{
          tabBarIcon: ({ color, size }) => <LedgerIcon color={color} size={size} />,
          headerRight: () => null,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => { navigation.navigate('Ledger'); },
        })}
      >
        {() => <LedgerStack />}
      </Tab.Screen>
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ tabBarIcon: ({ color, size }) => <CategoriesIcon color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Theme"
        component={ThemeToggleScreen}
        options={{
          tabBarIcon: ({ color, size }) => isDark ? <LightIcon color={color} size={size} /> : <DarkIcon color={color} size={size} />,
          tabBarLabel: isDark ? 'Light' : 'Dark',
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            toggleTheme();
          },
        }}
      />
    </Tab.Navigator>
  );
}
