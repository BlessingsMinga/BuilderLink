import { router } from 'expo-router';
import { BadgeCheck, Star } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { formatResponseTime, type BuilderSummary } from '../services/builder-service';
import { Avatar } from '@/shared/components/chip';
import { useThemeColors } from '@/shared/theme';

/** "Replies within 2 hours" from the stored average, for the card's last pill. */
const replyLabel = (minutes: number | null) => formatResponseTime(minutes)?.replace('Usually replies', 'Replies') ?? null;

/**
 * Summary of a builder, used on Home, in search results and in the saved
 * list: tile avatar, verified badge, trade and place, status pills, then
 * "View profile" and "Book" buttons.
 */
export function BuilderCard({ builder }: { builder: BuilderSummary }) {
  const colors = useThemeColors();
  const reply = replyLabel(builder.responseTimeMinutes);
  const openProfile = () => router.push({ pathname: '/builders/[id]', params: { id: builder.id } });
  return (
    <View className="gap-4 rounded-[22px] border border-line bg-surface p-[18px]">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${builder.name}${builder.verified ? ', verified' : ''}. ${builder.trades.join(', ')}. ${builder.district ?? 'Malawi'}.`}
        onPress={openProfile}
        className="flex-row items-center gap-3.5 active:opacity-80"
      >
        <Avatar name={builder.name} shape="tile" photoUrl={builder.avatarUrl} />
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-1.5">
            <Text numberOfLines={1} className="shrink font-semibold text-base text-ink">
              {builder.name}
            </Text>
            {builder.verified ? <BadgeCheck size={18} color={colors.onPrimary} fill={colors.brand} /> : null}
          </View>
          <Text numberOfLines={1} className="font-body text-xs text-muted">
            {[builder.trades[0] ?? 'Builder', builder.district ?? 'Malawi', `${builder.experience} yrs`].join(' · ')}
          </Text>
        </View>
      </Pressable>

      <View className="flex-row flex-wrap gap-2">
        {builder.available ? (
          <View className="flex-row items-center gap-1.5 rounded-[10px] bg-brand-soft px-2.5 py-1.5">
            <View className="h-1.5 w-1.5 rounded-full bg-primary" />
            <Text className="font-semibold text-xs text-brand">{reply ?? 'Available'}</Text>
          </View>
        ) : (
          <View className="rounded-[10px] bg-canvas px-2.5 py-1.5">
            <Text className="font-medium text-xs text-muted">Not taking jobs</Text>
          </View>
        )}
        <View className="flex-row items-center gap-1 rounded-[10px] bg-canvas px-2.5 py-1.5">
          {builder.rating > 0 ? <Star size={12} color={colors.star} fill={colors.star} /> : null}
          <Text className="font-medium text-xs text-ink">
            {builder.rating > 0 ? builder.rating.toFixed(1) : 'New on the app'}
          </Text>
        </View>
        {builder.completedJobs > 0 ? (
          <View className="rounded-[10px] bg-canvas px-2.5 py-1.5">
            <Text className="font-medium text-xs text-ink">
              {builder.completedJobs} {builder.completedJobs === 1 ? 'job' : 'jobs'} done
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row gap-2.5">
        <Pressable
          accessibilityRole="button"
          onPress={openProfile}
          className="h-[46px] flex-1 items-center justify-center rounded-[14px] border border-line active:bg-subtle"
        >
          <Text className="font-semibold text-sm text-ink">View profile</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Book ${builder.name}`}
          accessibilityState={{ disabled: !builder.available }}
          disabled={!builder.available}
          onPress={() => router.push({ pathname: '/booking', params: { builderId: builder.id } })}
          className={`h-[46px] flex-1 items-center justify-center rounded-[14px] bg-primary active:opacity-80 ${builder.available ? '' : 'opacity-40'}`}
        >
          <Text className="font-semibold text-sm text-on-primary">Book</Text>
        </Pressable>
      </View>
    </View>
  );
}
