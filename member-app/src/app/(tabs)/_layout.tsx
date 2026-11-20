import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconSource = ComponentProps<typeof Icon>['source'];

const TAB_BAR_HEIGHT = 64;

function tabIcon(source: IconSource) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Icon source={source} color={typeof color === 'string' ? color : undefined} size={size} />;
  };
}

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 12, lineHeight: 16 },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Beranda', tabBarIcon: tabIcon('home-variant-outline') }} />
      <Tabs.Screen name="schedules" options={{ title: 'Jadwal', tabBarIcon: tabIcon('calendar-month-outline') }} />
      <Tabs.Screen name="bookings" options={{ title: 'Booking Saya', tabBarIcon: tabIcon('ticket-confirmation-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: tabIcon('account-circle-outline') }} />
    </Tabs>
  );
}
