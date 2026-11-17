import { router } from 'expo-router';
import { CheckCheck, ChevronLeft, ImagePlus, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';
import { useThemeColors } from '@/shared/theme';

export default function Chat() {
  const colors = useThemeColors();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', body: 'Hello! I have reviewed your booking request.', mine: false },
    { id: '2', body: 'Thank you. Is Saturday morning possible?', mine: true },
  ]);

  const send = () => {
    if (text.trim()) {
      setMessages([...messages, { id: String(Date.now()), body: text.trim(), mine: true }]);
      setText('');
    }
  };

  return (
    <Protected>
      <Screen>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface">
            <ChevronLeft color={colors.ink} />
          </Pressable>
          <View>
            <Text className="font-bold text-ink">Thoko Mbewe</Text>
            <Text className="text-sm text-success">Online · Bricklayer</Text>
          </View>
        </View>

        <View className="mt-7 gap-3">
          {messages.map((m) => (
            <View key={m.id} className={`max-w-[82%] rounded-2xl px-4 py-3 ${m.mine ? 'self-end bg-ink' : 'self-start bg-subtle'}`}>
              <Text className={m.mine ? 'text-canvas' : 'text-ink'}>{m.body}</Text>
              {m.mine ? (
                <View className="mt-1 items-end">
                  <CheckCheck size={14} color={colors.canvas} />
                </View>
              ) : null}
            </View>
          ))}
        </View>

        <View className="mt-auto pt-8">
          <View className="flex-row items-center gap-2 rounded-2xl border border-line bg-surface p-2">
            <Pressable className="h-11 w-11 items-center justify-center rounded-xl bg-brand-soft">
              <ImagePlus size={21} color={colors.brand} />
            </Pressable>
            <TextInput placeholderTextColor={colors.faint} value={text} onChangeText={setText} className="h-11 flex-1 text-base text-ink" placeholder="Write a message" onSubmitEditing={send} />
            <Pressable onPress={send} className="h-11 w-11 items-center justify-center rounded-xl bg-ink">
              <Send size={19} color={colors.canvas} />
            </Pressable>
          </View>
          <Text className="mt-2 text-center text-xs text-faint">Messages are private to booking participants.</Text>
        </View>
      </Screen>
    </Protected>
  );
}
