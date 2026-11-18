import { useLocalSearchParams } from 'expo-router';
import type { ImagePickerAsset } from 'expo-image-picker';
import { ImagePlus, MessageCircle, SendHorizontal, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { useBooking, useBookingMessages, useConversation, useSendMessage, useSendPhoto } from '@/features/bookings/hooks/use-bookings';
import type { ChatMessage } from '@/features/bookings/services/chat-service';
import { markConversationRead } from '@/features/bookings/services/conversation-service';
import { PhotoPermissionDenied, PickCancelled, pickPhoto, thumbnailUrl } from '@/features/portfolio/services/portfolio-service';
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
  const sendPhoto = useSendPhoto(bookingId, session?.userId);
  const [photo, setPhoto] = useState<ImagePickerAsset | null>(null);
  const [openPhoto, setOpenPhoto] = useState<string | null>(null);
  const list = useRef<FlatList<ChatMessage>>(null);
  const conversation = useConversation(bookingId);
  const userId = session?.userId;

  // While the chat is open, keep it marked as read for this user.
  const unreadForMe = userId ? (conversation?.unread[userId] ?? 0) : 0;
  useEffect(() => {
    if (!bookingId || !userId || unreadForMe === 0) return;
    markConversationRead(bookingId, userId).catch((failure) => console.warn('Marking chat read failed:', failure));
  }, [bookingId, userId, unreadForMe]);

  // "Seen" goes under my latest delivered message once the other party has read past it.
  const otherId = conversation ? (conversation.customerId === userId ? conversation.builderId : conversation.customerId) : undefined;
  const otherReadAt = otherId ? conversation?.readAt[otherId] : undefined;
  const lastMine = messages ? [...messages].reverse().find((message) => message.senderId === userId && !message.pending) : undefined;
  const seenId = lastMine?.createdAt && otherReadAt && otherReadAt >= lastMine.createdAt ? lastMine.id : undefined;

  const isBuilder = booking.data?.builderId === session?.userId;
  const otherName = booking.data ? (isBuilder ? booking.data.customerName : booking.data.builderName) : '';
  const open = booking.data?.status === 'pending' || booking.data?.status === 'accepted';

  const choosePhoto = (source: 'camera' | 'library') => {
    setSendError(null);
    pickPhoto({ source, edit: false })
      .then(setPhoto)
      .catch((failure) => {
        if (failure instanceof PickCancelled) return;
        setSendError(failure instanceof PhotoPermissionDenied ? failure.message : failureMessage(failure, 'open your photos'));
      });
  };

  const askForPhoto = () =>
    Alert.alert('Send a photo', undefined, [
      { text: 'Take photo', onPress: () => choosePhoto('camera') },
      { text: 'Choose from library', onPress: () => choosePhoto('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const submit = () => {
    const text = draft.trim();
    if (!text && !photo) return;
    setSendError(null);

    // A photo must upload first, so it can't be queued offline like text.
    // Keep the photo and caption until the send succeeds.
    if (photo) {
      sendPhoto.mutate(
        { asset: photo, caption: text },
        {
          onSuccess: () => {
            setPhoto(null);
            setDraft('');
          },
          onError: (failure) => {
            console.warn('Sending photo failed:', failure);
            setSendError(failureMessage(failure, 'send your photo'));
          },
        },
      );
      return;
    }

    // Not awaited: offline, Firestore queues the message (shown as "Sending…") and
    // delivers it on reconnect, so the input must stay usable.
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
  const uploading = sendPhoto.isPending;
  const canSend = (Boolean(draft.trim()) || Boolean(photo)) && !uploading;

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
                      {item.imageUrl ? (
                        <Pressable
                          accessibilityRole="imagebutton"
                          accessibilityLabel="Open photo"
                          onPress={() => setOpenPhoto(item.imageUrl)}
                          className="-mx-2 mb-1 mt-0.5 active:opacity-80"
                        >
                          <Image source={{ uri: thumbnailUrl(item.imageUrl, 600) }} className="h-56 w-56 rounded-xl bg-subtle" />
                        </Pressable>
                      ) : null}
                      {item.text ? (
                        <Text className={`font-body text-base ${mine ? 'text-on-primary' : 'text-ink'}`}>{item.text}</Text>
                      ) : null}
                      <Text className={`mt-0.5 text-right font-body text-xs ${mine ? 'text-on-primary/70' : 'text-faint'}`}>
                        {item.pending ? 'Sending…' : item.createdAt ? formatTime(item.createdAt) : ''}
                        {item.id === seenId ? ' · Seen' : ''}
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
                {photo ? (
                  <View className="mb-3 flex-row items-center gap-3">
                    <View>
                      <Image source={{ uri: photo.uri }} className="h-20 w-20 rounded-xl bg-subtle" accessibilityLabel="Photo to send" />
                      {uploading ? (
                        <View className="absolute inset-0 items-center justify-center rounded-xl bg-black/40">
                          <ActivityIndicator color="#fff" />
                        </View>
                      ) : (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Remove photo"
                          onPress={() => setPhoto(null)}
                          className="absolute -right-2 -top-2 h-7 w-7 items-center justify-center rounded-full bg-ink"
                        >
                          <X size={14} color={colors.canvas} />
                        </Pressable>
                      )}
                    </View>
                    <Text className="flex-1 font-body text-sm text-muted">
                      {uploading ? 'Uploading photo…' : 'Add a caption, or tap send.'}
                    </Text>
                  </View>
                ) : null}
                <View className="flex-row items-end gap-2">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add a photo"
                    disabled={uploading}
                    onPress={askForPhoto}
                    className={`h-12 w-10 items-center justify-center ${uploading ? 'opacity-40' : 'active:opacity-70'}`}
                  >
                    <ImagePlus size={22} color={colors.brand} />
                  </Pressable>
                  <TextInput
                    value={draft}
                    onChangeText={(text) => {
                      setDraft(text);
                      if (sendError) setSendError(null);
                    }}
                    placeholder={photo ? 'Add a caption' : 'Write a message'}
                    placeholderTextColor={colors.faint}
                    multiline
                    maxLength={1000}
                    accessibilityLabel="Message"
                    className="max-h-32 min-h-12 flex-1 rounded-2xl border border-line bg-canvas px-4 py-3 font-body text-base text-ink"
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Send message"
                    disabled={!canSend}
                    onPress={submit}
                    className={`h-12 w-12 items-center justify-center rounded-full bg-primary ${!canSend ? 'opacity-40' : 'active:opacity-80'}`}
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

        <Modal visible={Boolean(openPhoto)} transparent animationType="fade" onRequestClose={() => setOpenPhoto(null)}>
          <View className="flex-1 bg-black">
            <SafeAreaView edges={['top']} className="items-end px-4 py-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close photo"
                onPress={() => setOpenPhoto(null)}
                className="h-11 w-11 items-center justify-center rounded-full bg-white/15 active:opacity-70"
              >
                <X size={22} color="#fff" />
              </Pressable>
            </SafeAreaView>
            {openPhoto ? <Image source={{ uri: openPhoto }} resizeMode="contain" className="flex-1" accessibilityLabel="Photo" /> : null}
          </View>
        </Modal>
      </View>
    </Protected>
  );
}
