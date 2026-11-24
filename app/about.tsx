import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';
import { ChevronRight, FileText, Mail, ScrollText, ShieldCheck, Users } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { LEGAL_DOCS, SUPPORT_EMAIL, type LegalDocKey } from '@/features/legal/content';
import { BrandMark } from '@/shared/components/brand-mark';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { useThemeColors } from '@/shared/theme';

const DOC_ICONS: Record<LegalDocKey, typeof FileText> = {
  privacy: ShieldCheck,
  terms: ScrollText,
  community: Users,
  verification: FileText,
};

export default function About() {
  const colors = useThemeColors();
  const version = Constants.expoConfig?.version ?? '';

  return (
    <Screen header={<ScreenHeader title="About BuilderLink" />}>
      <View className="mb-5 items-center gap-3 rounded-[22px] border border-line bg-surface p-6">
        <BrandMark />
        <Text className="font-heading text-xl text-ink">BuilderLink Malawi</Text>
        {version ? <Text className="font-body text-sm text-muted">Version {version}</Text> : null}
        <Text className="text-center font-body text-base leading-6 text-muted">
          Find trusted, verified builders and artisans near you, agree the job, and keep every message and booking in one place.
        </Text>
      </View>

      <Text className="mb-2 px-1 font-semibold text-sm text-muted">Data, privacy & policies</Text>
      <View className="overflow-hidden rounded-[22px] border border-line bg-surface">
        {(Object.keys(LEGAL_DOCS) as LegalDocKey[]).map((key, index) => {
          const Icon = DOC_ICONS[key];
          return (
            <Row
              key={key}
              divider={index > 0}
              icon={<Icon size={20} color={colors.brand} />}
              label={LEGAL_DOCS[key].title}
              hint={LEGAL_DOCS[key].summary}
              onPress={() => router.push(`/legal/${key}` as Href)}
            />
          );
        })}
      </View>

      <Text className="mb-2 mt-5 px-1 font-semibold text-sm text-muted">Your data</Text>
      <View className="overflow-hidden rounded-[22px] border border-line bg-surface">
        <Row
          icon={<Mail size={20} color={colors.brand} />}
          label="Request or delete my data"
          hint="Email us to get a copy of your data or close your account."
          onPress={() =>
            Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Data request')}`)
          }
        />
      </View>

      <Text className="mt-6 text-center font-body text-xs text-faint">© {new Date().getFullYear()} BuilderLink Malawi</Text>
    </Screen>
  );
}

function Row({ icon, label, hint, onPress, divider = false }: { icon: ReactNode; label: string; hint: string; onPress: () => void; divider?: boolean }) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`min-h-16 flex-row items-center gap-4 px-4 py-3 active:bg-subtle ${divider ? 'border-t border-line' : ''}`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-soft">{icon}</View>
      <View className="flex-1">
        <Text className="font-semibold text-base text-ink">{label}</Text>
        <Text className="font-body text-sm text-muted">{hint}</Text>
      </View>
      <ChevronRight size={20} color={colors.faint} />
    </Pressable>
  );
}
