import { Tabs } from 'expo-router';
import { Bell, Heart, House, Search, UserRound } from 'lucide-react-native';
import { Protected } from '@/shared/components/protected';
import { useThemeColors } from '@/shared/theme';

const icons = { index: House, search: Search, favorites: Heart, notifications: Bell, profile: UserRound };

export default function TabLayout() {
  const colors = useThemeColors();
  return (
    <Protected>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.ink,
          tabBarInactiveTintColor: colors.faint,
          tabBarStyle: { backgroundColor: colors.canvas, borderTopColor: colors.line, elevation: 0 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          sceneStyle: { backgroundColor: colors.canvas },
          tabBarIcon: ({ color, size, focused }) => {
            const Icon = icons[route.name as keyof typeof icons];
            return <Icon color={color} size={size} strokeWidth={focused ? 2.25 : 1.75} />;
          },
        })}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="search" options={{ title: 'Search' }} />
        <Tabs.Screen name="favorites" options={{ title: 'Saved' }} />
        <Tabs.Screen name="notifications" options={{ title: 'Alerts' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </Protected>
  );
}
