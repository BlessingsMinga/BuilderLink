import { router } from 'expo-router';
import { AlertTriangle, BarChart3, ChevronLeft, ClipboardCheck, Users } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';
import { useThemeColors } from '@/shared/theme';

const cards = [
  { label: 'Pending verifications', value: '12', icon: ClipboardCheck, color: 'brand' },
  { label: 'Open reports', value: '3', icon: AlertTriangle, color: 'danger' },
  { label: 'Active users', value: '1,284', icon: Users, color: 'success' },
  { label: 'Monthly revenue', value: 'MWK 4.2m', icon: BarChart3, color: 'info' },
] as const;

export default function Admin() {
  const colors = useThemeColors();
  return (
    // Only authenticated administrators may view the dashboard.
    <Protected roles={['administrator']}>
      <Screen>
        <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface">
          <ChevronLeft color={colors.ink} />
        </Pressable>
        <Text className="mt-6 text-3xl font-bold text-ink">Admin dashboard</Text>
        <Text className="mt-2 text-muted">Platform operations at a glance.</Text>
        <View className="mt-7 flex-row flex-wrap gap-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <View key={card.label} className="w-[47%] rounded-2xl border border-line bg-surface p-4">
                <Icon size={22} color={colors[card.color]} />
                <Text className="mt-5 text-2xl font-bold text-ink">{card.value}</Text>
                <Text className="mt-1 text-sm text-muted">{card.label}</Text>
              </View>
            );
          })}
        </View>
        <Text className="mt-8 text-lg font-bold text-ink">Priority queue</Text>
        <View className="mt-3 gap-3">
          <Row title="Verify builder documents" detail="12 submissions awaiting review" action="Review" />
          <Row title="Moderate customer report" detail="Possible price misrepresentation" action="Investigate" />
          <Row title="Review flagged content" detail="2 reviews require attention" action="Moderate" />
        </View>
        <View className="mt-8 rounded-2xl bg-subtle p-5">
          <Text className="font-bold text-ink">Security boundary</Text>
          <Text className="mt-1 leading-5 text-muted">
            Approval, suspension, payout, and role changes run through a protected server-side admin service—not this client screen.
          </Text>
        </View>
      </Screen>
    </Protected>
  );
}

function Row({ title, detail, action }: { title: string; detail: string; action: string }) {
  return (
    <View className="rounded-xl border border-line bg-surface p-4">
      <Text className="font-bold text-ink">{title}</Text>
      <Text className="mt-1 text-sm text-muted">{detail}</Text>
      <Text className="mt-3 font-semibold text-brand">{action}</Text>
    </View>
  );
}
