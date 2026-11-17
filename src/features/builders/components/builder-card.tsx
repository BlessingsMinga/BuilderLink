import { router } from 'expo-router';
import { MapPin, ShieldCheck, Star } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import type { BuilderSummary } from '../services/builder-service';
import { useThemeColors } from '@/shared/theme';

/** Tappable summary of a builder, used on Home, in search results and in the saved list. */
export function BuilderCard({ builder }: { builder: BuilderSummary }) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/builders/[id]', params: { id: builder.id } })}
      className="rounded-2xl border border-line bg-surface p-4 active:bg-subtle"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text numberOfLines={1} className="font-semibold text-base text-ink">
            {builder.name}
          </Text>
          <Text numberOfLines={1} className="mt-0.5 font-body text-sm text-muted">
            {builder.trades.length ? builder.trades.join(' · ') : 'Construction professional'}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Star size={15} color={colors.brand} fill={colors.brand} />
          <Text className="font-semibold text-sm text-ink">{builder.rating.toFixed(1)}</Text>
        </View>
      </View>
      <View className="mt-3 flex-row items-center gap-4">
        <View className="flex-row items-center gap-1">
          <MapPin size={15} color={colors.muted} />
          <Text className="font-body text-sm text-muted">{builder.district ?? 'Malawi'}</Text>
        </View>
        <Text className="font-body text-sm text-muted">{builder.experience} yrs experience</Text>
        {builder.verified ? (
          <View className="flex-row items-center gap-1">
            <ShieldCheck size={15} color={colors.success} />
            <Text className="font-medium text-sm text-success">Verified</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
