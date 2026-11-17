import { router } from 'expo-router';
import { BadgeCheck, MapPin, Star } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import type { BuilderSummary } from '../services/builder-service';
import { Avatar } from '@/shared/components/chip';
import { useThemeColors } from '@/shared/theme';

/** Tappable summary of a builder, used on Home, in search results and in the saved list. */
export function BuilderCard({ builder }: { builder: BuilderSummary }) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/builders/[id]', params: { id: builder.id } })}
      className="flex-row gap-4 rounded-3xl border border-line bg-surface p-4 active:bg-subtle"
    >
      <Avatar name={builder.name} />
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text numberOfLines={1} className="shrink font-bold text-base text-ink">
            {builder.name}
          </Text>
          {builder.verified ? <BadgeCheck accessibilityLabel="Verified" size={18} color={colors.brand} /> : null}
        </View>
        <Text numberOfLines={1} className="font-body text-sm text-muted">
          {builder.trades.length ? builder.trades.join(' · ') : 'Construction professional'}
        </Text>
        <View className="mt-2 flex-row flex-wrap items-center gap-x-4 gap-y-1">
          <View className="flex-row items-center gap-1">
            <Star size={16} color={colors.star} fill={colors.star} />
            <Text className="font-semibold text-sm text-ink">{builder.rating.toFixed(1)}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <MapPin size={16} color={colors.muted} />
            <Text className="font-body text-sm text-muted">{builder.district ?? 'Malawi'}</Text>
          </View>
          <Text className="font-body text-sm text-muted">{builder.experience} yrs</Text>
        </View>
      </View>
    </Pressable>
  );
}
