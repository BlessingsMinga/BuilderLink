import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera, ChevronLeft, FileCheck2, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/shared/components/app-button';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';
import { useThemeColors } from '@/shared/theme';

export default function BuilderProfile() {
  const colors = useThemeColors();
  const [businessName, setBusinessName] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState(['Bricklaying', 'Plastering']);
  const [photos, setPhotos] = useState(0);
  const [available, setAvailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectPhotos = async () => {
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 6,
        quality: 0.8,
      });
      if (!picked.canceled) setPhotos(picked.assets.length);
    } catch {
      Alert.alert('Could not open photos', 'Please try again.');
    }
  };

  const save = async () => {
    if (!businessName.trim()) {
      Alert.alert('Business name required', 'Enter your business or professional name.');
      return;
    }
    setSubmitting(true);
    try {
      // TODO: persist to the builders table once the data layer is connected.
      await new Promise((r) => setTimeout(r, 300));
      Alert.alert('Saved', 'Your builder profile is ready for review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Protected>
      <Screen>
      <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface">
        <ChevronLeft color={colors.ink} />
      </Pressable>
      <Text className="mt-6 text-3xl font-bold text-ink">Builder profile</Text>
      <Text className="mt-2 text-muted">Show customers your skills and completed work.</Text>

      <Section title="Professional details">
        <Field label="Business or professional name" placeholder="Mbewe Building Services" value={businessName} onChangeText={setBusinessName} />
        <Field label="Years of experience" placeholder="8" keyboardType="number-pad" value={yearsExperience} onChangeText={setYearsExperience} />
        <Field label="About your work" placeholder="Tell customers about your work" multiline value={bio} onChangeText={setBio} />
      </Section>

      <Section title="Skills">
        <View className="flex-row flex-wrap gap-2">
          {skills.map((skill) => (
            <View key={skill} className="rounded-xl bg-subtle px-3 py-2">
              <Text className="font-semibold text-ink">{skill}</Text>
            </View>
          ))}
          <Pressable onPress={() => setSkills([...skills, 'Site supervision'])} className="flex-row items-center gap-1 rounded-xl border border-line px-3 py-2">
            <Plus size={16} color={colors.brand} />
            <Text className="font-semibold text-brand">Add skill</Text>
          </Pressable>
        </View>
      </Section>

      <Section title="Work gallery">
        <Pressable onPress={selectPhotos} className="items-center rounded-2xl border border-dashed border-line bg-subtle px-5 py-7">
          <Camera size={26} color={colors.brand} />
          <Text className="mt-2 font-bold text-brand">Add completed work</Text>
          <Text className="mt-1 text-sm text-muted">{photos ? `${photos} photo(s) selected` : 'Up to 6 photos'}</Text>
        </Pressable>
      </Section>

      <Section title="Verification documents">
        <Pressable onPress={() => Alert.alert('Document upload', 'National ID, certificates and licences are securely stored for review.')} className="flex-row items-center gap-3 rounded-xl border border-line bg-surface p-4">
          <FileCheck2 color={colors.success} />
          <Text className="font-bold text-ink">Upload ID or certificates</Text>
        </Pressable>
      </Section>

      <Section title="Availability">
        <Pressable onPress={() => setAvailable(!available)} className="rounded-xl border border-line bg-surface p-4">
          <Text className="font-bold text-ink">{available ? 'Available for work' : 'Currently unavailable'}</Text>
          <Text className="mt-1 text-sm text-muted">Tap to update your availability</Text>
        </Pressable>
      </Section>

      <View className="my-7">
        <AppButton label="Save builder profile" loading={submitting} onPress={save} />
      </View>
    </Screen>
    </Protected>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-8">
      <Text className="mb-3 text-lg font-bold text-ink">{title}</Text>
      {children}
    </View>
  );
}

function Field({
  label,
  placeholder,
  multiline = false,
  keyboardType,
  value,
  onChangeText,
}: {
  label: string;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'email-address' | 'phone-pad';
  value: string;
  onChangeText: (text: string) => void;
}) {
  const colors = useThemeColors();
  return (
    <View className="mb-3">
      <Text className="mb-2 text-sm font-semibold text-ink">{label}</Text>
      <TextInput
        className={`rounded-xl border border-line bg-surface px-4 text-base text-ink ${multiline ? 'h-24 pt-4' : 'h-14'}`}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        multiline={multiline}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}