import { router, type Href } from 'expo-router';
import { Camera, CheckCheck, MessageCircle, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { useConversations } from '@/features/bookings/hooks/use-bookings';
import type { Conversation } from '@/features/bookings/services/conversation-service';
import { Screen } from '@/shared/components/screen';
import { ListSkeleton } from '@/shared/components/skeleton';
import { EmptyState, ErrorState } from '@/shared/components/states';
import { useThemeColors } from '@/shared/theme';

/** Previews of photo messages start with this marker (see chat-service). */
const PHOTO_MARKER = '📷';

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
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term || !conversations) return conversations;
    return conversations.filter((item) =>
      [item.customerName, item.builderName, item.service].some((text) => text.toLowerCase().includes(term)),
    );
  }, [conversations, search]);

  return (
    <Screen
      hero={
        <>
          <Text accessibilityRole="header" className="font-heading text-3xl text-white">
            Messages
          </Text>
          <Text className="mt-1 font-medium text-sm text-white/80">Chats with your customers and builders.</Text>
          {conversations?.length ? (
            <View className="mt-4 h-12 flex-row items-center gap-2 rounded-2xl bg-white/15 px-4">
              <Search size={18} color="#FFFFFF" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name or job"
                placeholderTextColor="rgba(255,255,255,0.75)"
                accessibilityLabel="Search chats"
                returnKeyType="search"
                className="h-12 flex-1 font-body text-base text-white"
              />
            </View>
          ) : null}
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
      ) : !filtered?.length ? (
        <EmptyState icon={<Search size={26} color={colors.brand} />} message={`No chats match “${search.trim()}”.`} />
      ) : (
        <View className="overflow-hidden rounded-3xl border border-line bg-surface">
          {filtered.map((item, index) => (
            <Row key={item.bookingId} conversation={item} userId={userId!} divider={index > 0} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function Row({ conversation, userId, divider }: { conversation: Conversation; userId: string; divider: boolean }) {
  const colors = useThemeColors();
  const otherId = conversation.customerId === userId ? conversation.builderId : conversation.customerId;
  const other = conversation.customerId === userId ? conversation.builderName : conversation.customerName;
  const unread = conversation.unread[userId] ?? 0;
  const mine = conversation.lastSenderId === userId;
  const closed = conversation.status !== 'pending' && conversation.status !== 'accepted';
  const otherReadAt = conversation.readAt[otherId];
  const seen = mine && Boolean(otherReadAt && conversation.lastMessageAt && otherReadAt >= conversation.lastMessageAt);
  const isPhoto = conversation.lastMessage.startsWith(PHOTO_MARKER);
  const preview = isPhoto ? conversation.lastMessage.slice(PHOTO_MARKER.length).trim() || 'Photo' : conversation.lastMessage;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${other} about ${conversation.service}. ${mine ? 'You: ' : ''}${preview}${unread ? `. ${unread} unread` : ''}${seen ? '. Seen' : ''}`}
      onPress={() => router.push(`/chat/${conversation.bookingId}` as Href)}
      className={`min-h-[76px] flex-row items-center gap-3 px-4 py-3 active:bg-subtle ${divider ? 'border-t border-line' : ''}`}
    >
      <View className={`h-12 w-12 items-center justify-center rounded-full ${unread ? 'bg-primary' : 'bg-brand-soft'}`}>
        <Text className={`font-heading text-base ${unread ? 'text-on-primary' : 'text-brand'}`}>{other.charAt(0).toUpperCase()}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-baseline justify-between gap-2">
          <Text numberOfLines={1} className={`flex-1 text-base text-ink ${unread ? 'font-heading' : 'font-semibold'}`}>
            {other}
          </Text>
          <Text className={`text-xs ${unread ? 'font-bold text-brand' : 'font-medium text-muted'}`}>{formatWhen(conversation.lastMessageAt)}</Text>
        </View>
        <Text numberOfLines={1} className="font-body text-xs text-muted">
          {conversation.service}
          {closed ? ' · Closed' : ''}
        </Text>
        <View className="mt-1 flex-row items-center gap-1.5">
          {isPhoto ? <Camera size={15} color={colors.muted} /> : null}
          <Text numberOfLines={1} className={`flex-1 text-sm ${unread ? 'font-semibold text-ink' : 'font-body text-muted'}`}>
            {mine ? 'You: ' : ''}
            {preview}
          </Text>
          {unread ? (
            <View className="h-[22px] min-w-[22px] items-center justify-center rounded-full bg-primary px-1.5">
              <Text className="font-bold text-xs text-on-primary">{unread > 99 ? '99+' : unread}</Text>
            </View>
          ) : seen ? (
            <CheckCheck size={18} color={colors.brand} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
