import { router } from 'expo-router';
import { CalendarDays, ChevronLeft, MapPin, Wrench } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/shared/components/app-button';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';

const services = ['Bricklaying', 'Plastering', 'Foundation work', 'Wall repairs'];

export default function Booking() {
  const [service, setService] = useState(services[0]);
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const submit = () => {
    if (!date || !location || !description) {
      return Alert.alert('Complete your request', 'Add a date, location, and a short work description.');
    }
    Alert.alert('Request sent', 'Thoko will be notified and can accept or decline your booking.', [
      { text: 'View home', onPress: () => router.replace('/(tabs)') },
    ]);
  };

  return (
    <Protected>
      <Screen>
        <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
          <ChevronLeft color="#1E293B" />
        </Pressable>
        <Text className="mt-6 text-3xl font-extrabold text-ink">Request a booking</Text>
        <Text className="mt-2 text-slate-500">Send the details to Thoko Mbewe.</Text>

        <Section icon={<Wrench size={19} color="#F97316" />} title="Service">
          <View className="flex-row flex-wrap gap-2">
            {services.map((item) => (
              <Pressable key={item} onPress={() => setService(item)} className={`rounded-xl px-3 py-2 ${service === item ? 'bg-brand' : 'bg-white'}`}>
                <Text className={`font-semibold ${service === item ? 'text-white' : 'text-ink'}`}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section icon={<CalendarDays size={19} color="#F97316" />} title="Preferred date">
          <TextInput value={date} onChangeText={setDate} className="mt-3 h-14 rounded-2xl bg-white px-4 text-base" placeholder="DD/MM/YYYY" keyboardType="numbers-and-punctuation" />
        </Section>

        <Section icon={<MapPin size={19} color="#F97316" />} title="Job location">
          <TextInput value={location} onChangeText={setLocation} className="mt-3 h-14 rounded-2xl bg-white px-4 text-base" placeholder="Area, district and nearest landmark" />
        </Section>

        <Section title="Describe the work">
          <TextInput value={description} onChangeText={setDescription} multiline className="mt-3 h-32 rounded-2xl bg-white px-4 pt-4 text-base" placeholder="What needs to be done? Include dimensions or materials if you know them." />
        </Section>

        <View className="mt-8 rounded-2xl bg-orange-100 p-4">
          <Text className="font-bold text-orange-800">What happens next</Text>
          <Text className="mt-1 leading-5 text-orange-700">The builder reviews your request. Once accepted, you’ll confirm the deposit before work begins.</Text>
        </View>

        <View className="my-7">
          <AppButton label="Send booking request" onPress={submit} />
        </View>
      </Screen>
    </Protected>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View className="mt-7">
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-lg font-bold text-ink">{title}</Text>
      </View>
      {children}
    </View>
  );
}
