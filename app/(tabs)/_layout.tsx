import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { fonts, useTheme } from '@/ui/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function icon(name: IoniconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size ?? 22} color={color} />
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.bold, letterSpacing: -0.3 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11 },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Report a road hazard', tabBarLabel: 'Report', tabBarIcon: icon('warning') }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'My reports', tabBarLabel: 'History', tabBarIcon: icon('time') }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: 'Hazard map', tabBarLabel: 'Map', tabBarIcon: icon('map') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarLabel: 'Settings', tabBarIcon: icon('settings') }}
      />
    </Tabs>
  );
}
