import { Tabs } from 'expo-router';
import { PixelRatio } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, House, MessageCircle, Search, UserRound } from 'lucide-react-native';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { useUnreadCount } from '@/features/bookings/hooks/use-bookings';
import { Protected } from '@/shared/components/protected';
import { useThemeColors } from '@/shared/theme';

const icons = { index: House, search: Search, bookings: CalendarDays, messages: MessageCircle, profile: UserRound };

export default function TabLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  // Room for icon + label at the phone's text size, plus the system navigation area,
  // so labels are never clipped with large text or gesture/button navigation.
  const fontScale = Math.min(PixelRatio.getFontScale(), 1.6);
  const barHeight = Math.round(46 + 20 * fontScale) + Math.max(insets.bottom, 8);
  const unread = useUnreadCount(useAuthStore((state) => state.session?.userId));
  return (
    <Protected>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.faint,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, elevation: 0, height: barHeight, paddingTop: 6, paddingBottom: Math.max(insets.bottom, 8) },
          tabBarLabelStyle: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', marginTop: 2 },
          tabBarItemStyle: { paddingVertical: 2 },
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
        <Tabs.Screen
          name="messages"
          options={{ title: 'Messages', tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined, tabBarBadgeStyle: { backgroundColor: colors.brand } }}
        />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </Protected>
  );
}
