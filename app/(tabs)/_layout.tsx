import { Tabs } from 'expo-router';
import { PixelRatio, View } from 'react-native';
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
  // The bar is drawn as a floating rounded pill (see tabBarBackground), inset 12pt from the edges.
  const bottomGap = Math.max(insets.bottom, 12);
  const barHeight = Math.round(52 + 20 * fontScale) + bottomGap;
  const unread = useUnreadCount(useAuthStore((state) => state.session?.userId));
  return (
    <Protected>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: { backgroundColor: colors.canvas, borderTopWidth: 0, elevation: 0, height: barHeight, paddingTop: 10, paddingBottom: bottomGap + 6, paddingHorizontal: 12 },
          tabBarBackground: () => (
            <View style={{ flex: 1, backgroundColor: colors.canvas }}>
              <View
                style={{ position: 'absolute', left: 12, right: 12, top: 0, bottom: bottomGap, borderRadius: 24, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}
              />
            </View>
          ),
          tabBarLabelStyle: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', marginTop: 2 },
          tabBarItemStyle: { paddingVertical: 2 },
          sceneStyle: { backgroundColor: colors.canvas },
          tabBarIcon: ({ color, size, focused }) => {
            const Icon = icons[route.name as keyof typeof icons];
            return <Icon color={color} size={22} strokeWidth={focused ? 2 : 1.8} />;
          },
        })}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="search" options={{ title: 'Search' }} />
        <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
        <Tabs.Screen
          name="messages"
          options={{ title: 'Messages', tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined, tabBarBadgeStyle: { backgroundColor: colors.warn, color: '#1A1204', fontSize: 11 } }}
        />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </Protected>
  );
}
