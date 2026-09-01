import { router } from 'expo-router';
import { Bell, ChevronRight, MapPin, Search, ShieldCheck, Star } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useBuilders } from '@/features/builders/hooks/use-builders';
import type { BuilderSummary } from '@/features/builders/services/builder-service';
import { Screen } from '@/shared/components/screen';

const categories = ['Bricklayer', 'Plumber', 'Carpenter', 'Electrician'];

export default function Home() {
  const { data: builders = [], isLoading, isError, refetch } = useBuilders();
  // Home shows a short curated list — the top-rated verified professionals.
  const featured = builders.slice(0, 3);

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-sm text-slate-500">Good morning</Text>
          <Text className="text-2xl font-extrabold text-ink">Find the right builder</Text>
        </View>
        <Pressable
          accessibilityLabel="Notifications"
          onPress={() => router.push('/(tabs)/notifications')}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-white"
        >
          <Bell color="#1E293B" size={20} />
        </Pressable>
      </View>

      <Pressable onPress={() => router.push('/(tabs)/search')} className="mt-7 flex-row items-center gap-3 rounded-2xl bg-white px-4 py-4">
        <Search size={20} color="#64748B" />
        <Text className="text-base text-slate-400">What do you need help with?</Text>
      </Pressable>

      <View className="mt-8">
        <Text className="text-lg font-bold text-ink">Browse by trade</Text>
        <View className="mt-4 flex-row flex-wrap gap-3">
          {categories.map((category) => (
            <Pressable
              key={category}
              onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: category } })}
              className="rounded-2xl bg-orange-100 px-4 py-3"
            >
              <Text className="font-semibold text-orange-700">{category}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="mt-9 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-ink">Trusted near you</Text>
        <Pressable onPress={() => router.push('/(tabs)/search')}>
          <Text className="font-bold text-brand">See all</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="mt-6 items-center gap-3">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : isError ? (
        <Pressable onPress={() => refetch()} className="mt-6 items-center rounded-3xl bg-white p-5">
          <Text className="text-slate-500">Couldn’t load builders. Tap to retry.</Text>
        </Pressable>
      ) : featured.length === 0 ? (
        <View className="mt-6 rounded-3xl bg-white p-5">
          <Text className="text-center text-slate-500">No verified builders yet. Check back soon.</Text>
        </View>
      ) : (
        featured.map((builder) => <BuilderCard key={builder.id} builder={builder} />)
      )}
    </Screen>
  );
}

function BuilderCard({ builder }: { builder: BuilderSummary }) {
  return (
    <Pressable onPress={() => router.push({ pathname: '/builders/[id]', params: { id: builder.id } })} className="mt-4 rounded-3xl bg-white p-5">
      <View className="flex-row justify-between">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-slate-200">
          <Text className="text-lg font-extrabold text-slate-500">{builder.name.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Star size={17} fill="#F97316" color="#F97316" />
          <Text className="font-bold text-ink">{builder.rating.toFixed(1)}</Text>
          <Text className="text-slate-400">({builder.completedJobs})</Text>
        </View>
      </View>
      <Text className="mt-4 text-lg font-bold text-ink">{builder.name}</Text>
      <Text className="mt-1 text-slate-500">
        {builder.trades.join(' · ') || 'Construction professional'} · {builder.experience} years experience
      </Text>
      <View className="mt-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <MapPin size={16} color="#64748B" />
          <Text className="text-sm text-slate-500">{builder.district ?? 'Malawi'}</Text>
        </View>
        <ChevronRight size={18} color="#F97316" />
      </View>
      {builder.verified ? (
        <View className="mt-4 flex-row items-center gap-2">
          <ShieldCheck size={17} color="#16A34A" />
          <Text className="text-sm font-semibold text-success">Verified professional</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
