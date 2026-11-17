import { useLocalSearchParams } from 'expo-router';
import { MessageCircle, SendHorizontal } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { useBooking, useBookingMessages, useSendMessage } from '@/features/bookings/hooks/use-bookings';
import type { ChatMessage } from '@/features/bookings/services/chat-service';
import { Protected } from '@/shared/components/protected';
import { ScreenHeader } from '@/shared/components/screen-header';
import { EmptyState, ErrorState, ErrorText } from '@/shared/components/states';
import { failureMessage } from '@/shared/components/toast';
import { useThemeColors } from '@/shared/theme';

const formatTime = (date: Date) => date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const formatDay = (date: Date) => date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export default function Chat() {
  const colors = useThemeColors();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const session = useAuthStore((state) => state.session);
  const booking = useBooking(bookingId);
  const { messages, error, isLoading } = useBookingMessages(bookingId);
  const send = useSendMessage(bookingId, session?.userId);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const list = useRef<FlatList<ChatMessage>>(null);

  const isBuilder = booking.data?.builderId === session?.userId;
  const otherName = booking.data ? (isBuilder ? booking.data.customerName : booking.data.builderName) : '';
  const open = booking.data?.status === 'pending' || booking.data?.status === 'accepted';

  // Not awaited: offline, Firestore queues the message (shown as "Sending…") and
  // delivers it on reconnect, so the input must stay usable.
  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    setSendError(null);
    setDraft('');
    send.mutate(text, {
      onError: (failure) => {
        console.warn('Sending message failed:', failure);
        // Put the text back so nothing is lost.
        setDraft((current) => current || text);
        setSendError(failureMessage(failure, 'send your message'));
      },
    });
  };

  return (
    <Protected>
      <View className="flex-1 bg-canvas">
        <SafeAreaView edges={['top']} className="bg-canvas" />
        <ScreenHeader title={otherName || 'Messages'} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          {error || booking.isError ? (
            <View className="p-5">
              <ErrorState error={error ?? booking.error} what="these messages" />
            </View>
          ) : isLoading || booking.isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={colors.brand} />
            </View>
          ) : (
            <FlatList
              ref={list}
              data={messages}
              keyExtractor={(message) => message.id}
              contentContainerClassName="flex-grow gap-2 px-5 py-4"
              onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
              ListEmptyComponent={
                <View className="flex-1 justify-center">
                  <EmptyState
                    icon={<MessageCircle size={26} color={colors.brand} />}
                    message={open ? `No messages yet. Say hello to ${otherName} and agree on the details.` : 'No messages were sent for this booking.'}
                  />
                </View>
              }
              renderItem={({ item, index }) => {
                const mine = item.senderId === session?.userId;
                const previous = messages?.[index - 1];
                const showDay =
                  item.createdAt && (!previous?.createdAt || previous.createdAt.toDateString() !== item.createdAt.toDateString());
                return (
                  <View>
                    {showDay && item.createdAt ? (
                      <Text className="my-2 text-center font-medium text-xs text-faint">{formatDay(item.createdAt)}</Text>
                    ) : null}
                    <View className={`max-w-[80%] rounded-2xl px-4 py-2 ${mine ? 'self-end rounded-br-md bg-primary' : 'self-start rounded-bl-md border border-line bg-surface'}`}>
                      <Text className={`font-body text-base ${mine ? 'text-on-primary' : 'text-ink'}`}>{item.text}</Text>
                      <Text className={`mt-0.5 text-right font-body text-xs ${mine ? 'text-on-primary/70' : 'text-faint'}`}>
                        {item.pending ? 'Sending…' : item.createdAt ? formatTime(item.createdAt) : ''}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          )}

          <SafeAreaView edges={['bottom']} className="border-t border-line bg-surface px-4 py-3">
            {open ? (
              <>
                <View className="flex-row items-end gap-2">
                  <TextInput
                    value={draft}
                    onChangeText={(text) => {
                      setDraft(text);
                      if (sendError) setSendError(null);
                    }}
                    placeholder="Write a message"
                    placeholderTextColor={colors.faint}
                    multiline
                    maxLength={1000}
                    accessibilityLabel="Message"
                    className="max-h-32 min-h-12 flex-1 rounded-2xl border border-line bg-canvas px-4 py-3 font-body text-base text-ink"
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Send message"
                    disabled={!draft.trim()}
                    onPress={submit}
                    className={`h-12 w-12 items-center justify-center rounded-full bg-primary ${!draft.trim() ? 'opacity-40' : 'active:opacity-80'}`}
                  >
                    <SendHorizontal size={20} color={colors.onPrimary} />
                  </Pressable>
                </View>
                <ErrorText>{sendError}</ErrorText>
              </>
            ) : (
              <Text className="py-2 text-center font-body text-sm text-muted">
                {booking.data ? 'This booking is closed, so new messages can’t be sent.' : ' '}
              </Text>
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Protected>
  );
}
