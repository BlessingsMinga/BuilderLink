import { router, type Href } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { useConversations } from '@/features/bookings/hooks/use-bookings';
import type { Conversation } from '@/features/bookings/services/conversation-service';
import { Screen } from '@/shared/components/screen';
import { ListSkeleton } from '@/shared/components/skeleton';
import { EmptyState, ErrorState } from '@/shared/components/states';
import { useThemeColors } from '@/shared/theme';

/** "14:05" today, "Mon" this week, otherwise "3 Nov". */
function formatWhen(date: Date | null): string {
  if (!date) return '';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  const days = (now.getTime() - date.getTime()) / 86_400_000;
  if (days < 7) return date.toLocaleDateString('en-GB', { weekday: 'short' });
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function Messages() {
  const colors = useThemeColors();
  const userId = useAuthStore((state) => state.session?.userId);
  const { conversations, error, isLoading } = useConversations(userId);

  return (
    <Screen
      hero={
        <>
          <Text className="font-heading text-3xl text-white">Messages</Text>
          <Text className="mt-1 font-medium text-sm text-white/80">Chats with your customers and builders.</Text>
        </>
      }
    >
      {isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorState error={error} what="your messages" />
      ) : !conversations?.length ? (
        <EmptyState
          icon={<MessageCircle size={26} color={colors.brand} />}
          message="No conversations yet. Open a booking and tap Messages to start one."
        />
      ) : (
        <View className="overflow-hidden rounded-2xl border border-line bg-surface">
          {conversations.map((item, index) => (
            <Row key={item.bookingId} conversation={item} userId={userId!} divider={index > 0} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function Row({ conversation, userId, divider }: { conversation: Conversation; userId: string; divider: boolean }) {
  const other = conversation.customerId === userId ? conversation.builderName : conversation.customerName;
  const unread = conversation.unread[userId] ?? 0;
  const mine = conversation.lastSenderId === userId;
  const closed = conversation.status !== 'pending' && conversation.status !== 'accepted';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${other}${unread ? `, ${unread} unread` : ''}`}
      onPress={() => router.push(`/chat/${conversation.bookingId}` as Href)}
      className={`flex-row items-center gap-3 px-4 py-3 active:opacity-70 ${divider ? 'border-t border-line' : ''}`}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-soft">
        <Text className="font-heading-semibold text-base text-brand">{other.charAt(0).toUpperCase()}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-baseline justify-between gap-2">
          <Text numberOfLines={1} className={`flex-1 text-base text-ink ${unread ? 'font-heading-semibold' : 'font-medium'}`}>
            {other}
          </Text>
          <Text className={`font-body text-xs ${unread ? 'text-brand' : 'text-faint'}`}>{formatWhen(conversation.lastMessageAt)}</Text>
        </View>
        <Text numberOfLines={1} className="font-body text-xs text-faint">
          {conversation.service}
          {closed ? ' · Closed' : ''}
        </Text>
        <View className="mt-0.5 flex-row items-center gap-2">
          <Text numberOfLines={1} className={`flex-1 font-body text-sm ${unread ? 'text-ink' : 'text-muted'}`}>
            {mine ? 'You: ' : ''}
            {conversation.lastMessage}
          </Text>
          {unread ? (
            <View className="min-w-5 items-center rounded-full bg-primary px-1.5 py-0.5">
              <Text className="font-heading-semibold text-xs text-on-primary">{unread > 99 ? '99+' : unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
