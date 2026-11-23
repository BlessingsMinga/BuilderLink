import { router } from 'expo-router';
import { BadgeCheck, ChevronRight, MapPin, Star } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { formatResponseTime, type BuilderSummary } from '../services/builder-service';
import { Avatar } from '@/shared/components/chip';
import { useThemeColors } from '@/shared/theme';

/** "Replies within 2 hours" from the stored average, for the card's last pill. */
const replyLabel = (minutes: number | null) => formatResponseTime(minutes)?.replace('Usually replies', 'Replies') ?? null;

/**
 * Tappable summary of a builder, used on Home, in search results and in the
 * saved list. Mirrors the profile design: tile avatar, verified badge,
 * location, then rating, jobs and availability as small pills.
 */
export function BuilderCard({ builder }: { builder: BuilderSummary }) {
  const colors = useThemeColors();
  const reply = replyLabel(builder.responseTimeMinutes);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${builder.name}${builder.verified ? ', verified' : ''}. ${builder.trades.join(', ')}. Rated ${builder.rating.toFixed(1)}. ${builder.completedJobs} jobs done.`}
      onPress={() => router.push({ pathname: '/builders/[id]', params: { id: builder.id } })}
      className="rounded-3xl border border-line bg-surface p-4 active:bg-subtle"
    >
      <View className="flex-row items-center gap-4">
        <Avatar name={builder.name} shape="tile" photoUrl={builder.avatarUrl} />
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text numberOfLines={1} className="shrink font-heading text-base text-ink">
              {builder.name}
            </Text>
            {builder.verified ? <BadgeCheck size={18} color={colors.onPrimary} fill={colors.brand} /> : null}
          </View>
          <Text numberOfLines={1} className="font-body text-sm text-muted">
            {builder.trades.length ? builder.trades.join(' · ') : 'Construction professional'}
          </Text>
          <View className="mt-0.5 flex-row items-center gap-1">
            <MapPin size={14} color={colors.muted} />
            <Text numberOfLines={1} className="font-body text-xs text-muted">
              {builder.district ?? 'Malawi'} · {builder.experience} yrs experience
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color={colors.faint} />
      </View>

      <View className="mt-3 flex-row flex-wrap gap-2">
        <View className="flex-row items-center gap-1 rounded-full bg-canvas px-2.5 py-1">
          <Star size={13} color={colors.star} fill={colors.star} />
          <Text className="font-bold text-xs text-ink">{builder.rating > 0 ? builder.rating.toFixed(1) : 'New'}</Text>
        </View>
        <View className="rounded-full bg-canvas px-2.5 py-1">
          <Text className="font-semibold text-xs text-ink">
            {builder.completedJobs} {builder.completedJobs === 1 ? 'job' : 'jobs'} done
          </Text>
        </View>
        {builder.available ? (
          <View className="flex-row items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1">
            <View className="h-1.5 w-1.5 rounded-full bg-primary" />
            <Text className="font-bold text-xs text-brand">{reply ?? 'Available'}</Text>
          </View>
        ) : (
          <View className="rounded-full bg-subtle px-2.5 py-1">
            <Text className="font-semibold text-xs text-muted">Not taking jobs</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
