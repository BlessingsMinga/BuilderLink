import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BadgeCheck, MapPin, Star } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useBuilder } from '@/features/builders/hooks/use-builders';
import { AppButton } from '@/shared/components/app-button';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';

export default function BuilderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: builder, isLoading, isError, refetch } = useBuilder(id);

  return (
    <Protected>
      <Screen>
        <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
          <ArrowLeft color="#1E293B" />
        </Pressable>

        {isLoading ? (
          <View className="mt-16 items-center gap-3">
            <ActivityIndicator size="large" color="#F97316" />
            <Text className="text-slate-500">Loading profile…</Text>
          </View>
        ) : isError || !builder ? (
          <View className="mt-16 items-center gap-4 rounded-3xl bg-white p-6">
            <Text className="text-base text-slate-500">We couldn’t load this professional.</Text>
            <Pressable onPress={() => refetch()} className="rounded-2xl bg-brand px-6 py-3">
              <Text className="font-bold text-white">Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="mt-6 h-28 w-28 items-center justify-center self-center rounded-full bg-slate-200">
              <Text className="text-3xl font-extrabold text-slate-500">
                {builder.name.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View className="mt-5 items-center">
              <Text className="text-2xl font-extrabold text-ink">{builder.name}</Text>
              {builder.verified ? (
                <View className="mt-2 flex-row items-center gap-2">
                  <BadgeCheck size={18} color="#16A34A" />
                  <Text className="font-semibold text-success">Verified professional</Text>
                </View>
              ) : null}
              <Text className="mt-2 text-slate-500">
                {builder.trades.join(' · ') || 'Construction professional'} · {builder.district ?? 'Malawi'}
              </Text>
            </View>
            <View className="mt-8 flex-row justify-around rounded-3xl bg-white p-5">
              <Stat value={builder.rating.toFixed(1)} label="Rating" />
              <Stat value={`${builder.experience} yrs`} label="Experience" />
              <Stat value={String(builder.completedJobs)} label="Jobs done" />
            </View>
            <View className="mt-8">
              <AppButton label="Request a booking" onPress={() => router.push('/booking')} />
            </View>
            <View className="mt-4 flex-row items-center gap-1">
              <MapPin size={16} color="#64748B" />
              <Text className="text-sm text-slate-500">Based in {builder.district ?? 'Malawi'}</Text>
            </View>
          </>
        )}
      </Screen>
    </Protected>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="items-center">
      <Text className="text-lg font-extrabold text-ink">{value}</Text>
      <Text className="text-sm text-slate-500">{label}</Text>
    </View>
  );
}
