import { Tabs } from 'expo-router';
import { CalendarDays, House, Search, UserRound } from 'lucide-react-native';
import { Protected } from '@/shared/components/protected';
import { useThemeColors } from '@/shared/theme';

const icons = { index: House, search: Search, bookings: CalendarDays, profile: UserRound };

export default function TabLayout() {
  const colors = useThemeColors();
  return (
    <Protected>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.faint,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, elevation: 0 },
          tabBarLabelStyle: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' },
          sceneStyle: { backgroundColor: colors.canvas },
          tabBarIcon: ({ color, size, focused }) => {
            const Icon = icons[route.name as keyof typeof icons];
            return <Icon color={color} size={size} strokeWidth={focused ? 2.25 : 1.75} />;
          },
        })}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="search" options={{ title: 'Search' }} />
        <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </Protected>
  );
}
