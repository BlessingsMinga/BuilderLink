import { router } from 'expo-router';
import { MapPin, ShieldCheck, Star } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import type { BuilderSummary } from '../services/builder-service';

/** Tappable summary of a builder, used in search results and the saved list. */
export function BuilderCard({ builder }: { builder: BuilderSummary }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/builders/[id]', params: { id: builder.id } })}
      className="rounded-3xl bg-white p-5"
    >
      <View className="flex-row justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-lg font-bold text-ink">{builder.name}</Text>
          <Text className="mt-1 text-slate-500">
            {builder.trades.length ? builder.trades.join(' · ') : 'Construction professional'} · {builder.experience} years
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Star size={16} color="#F97316" fill="#F97316" />
          <Text className="font-bold text-ink">{builder.rating.toFixed(1)}</Text>
        </View>
      </View>
      <View className="mt-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <MapPin size={16} color="#64748B" />
          <Text className="text-sm text-slate-500">{builder.district ?? 'Malawi'}</Text>
        </View>
        <Text className="font-semibold text-slate-500">{builder.completedJobs} jobs done</Text>
      </View>
      {builder.verified ? (
        <View className="mt-3 flex-row items-center gap-1">
          <ShieldCheck size={16} color="#16A34A" />
          <Text className="text-sm font-semibold text-success">Verified</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
