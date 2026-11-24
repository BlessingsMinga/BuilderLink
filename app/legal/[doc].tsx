import { useLocalSearchParams } from 'expo-router';
import { Linking, Text, View } from 'react-native';
import { LEGAL_DOCS, LEGAL_UPDATED, SUPPORT_EMAIL, type LegalDocKey } from '@/features/legal/content';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';

export default function LegalDocument() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const content = LEGAL_DOCS[(doc in LEGAL_DOCS ? doc : 'privacy') as LegalDocKey];

  return (
    <Screen header={<ScreenHeader title={content.title} />}>
      <Text className="mb-5 font-body text-sm text-muted">Last updated {LEGAL_UPDATED}</Text>
      <View className="gap-6">
        {content.sections.map((section) => (
          <View key={section.heading} className="gap-2">
            <Text accessibilityRole="header" className="font-heading text-lg text-ink">
              {section.heading}
            </Text>
            {section.body.map((paragraph) => (
              <Text key={paragraph} className="font-body text-base leading-6 text-ink">
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
        <View className="gap-2 rounded-[22px] border border-line bg-surface p-4">
          <Text className="font-semibold text-base text-ink">Questions?</Text>
          <Text className="font-body text-base text-muted">
            Email us at{' '}
            <Text className="font-semibold text-brand" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
              {SUPPORT_EMAIL}
            </Text>
          </Text>
        </View>
      </View>
    </Screen>
  );
}
