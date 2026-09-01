import { router, useLocalSearchParams } from 'expo-router';
import { Filter, MapPin, Search as SearchIcon, ShieldCheck, Star } from 'lucide-react-native';
import { useMemo, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useBuilders } from '@/features/builders/hooks/use-builders';
import { MALAWI_DISTRICTS } from '@/features/builders/services/builder-service';
import { Screen } from '@/shared/components/screen';

const districts = ['All districts', ...MALAWI_DISTRICTS];

export default function Search() {
  // `q` may be supplied when browsing by trade from the Home screen.
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(q ?? '');
  const [district, setDistrict] = useState('All districts');
  const [verified, setVerified] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Keep the search box in sync when navigated to with a new trade query.
  useEffect(() => {
    setQuery(q ?? '');
  }, [q]);

  const { data: builders = [], isLoading, isError, refetch } = useBuilders();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchesQuery = (b: { name: string; trades: string[] }) =>
      !q || `${b.name} ${b.trades.join(' ')}`.toLowerCase().includes(q);
    return builders.filter(
      (b) =>
        (district === 'All districts' || b.district === district) &&
        (!verified || b.verified) &&
        matchesQuery(b),
    );
  }, [builders, district, query, verified]);

  return (
    <Screen>
      <Text className="text-2xl font-extrabold text-ink">Find professionals</Text>
      <View className="mt-6 flex-row gap-3">
        <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-white px-4">
          <SearchIcon size={19} color="#64748B" />
          <TextInput value={query} onChangeText={setQuery} className="h-14 flex-1 text-base" placeholder="Search a trade or name" />
        </View>
        <Pressable onPress={() => setShowFilters(!showFilters)} className="h-14 w-14 items-center justify-center rounded-2xl bg-brand">
          <Filter color="white" size={20} />
        </Pressable>
      </View>
      {showFilters ? (
        <View className="mt-4 rounded-3xl bg-white p-4">
          <Text className="font-bold text-ink">District</Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {districts.map((item) => (
              <Pressable key={item} onPress={() => setDistrict(item)} className={`rounded-xl px-3 py-2 ${item === district ? 'bg-brand' : 'bg-slate-100'}`}>
                <Text className={`text-sm font-semibold ${item === district ? 'text-white' : 'text-slate-600'}`}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => setVerified(!verified)} className="mt-4 flex-row items-center gap-2">
            <View className={`h-5 w-5 rounded ${verified ? 'bg-success' : 'border border-slate-300'}`} />
            <Text className="font-semibold text-ink">Verified professionals only</Text>
          </Pressable>
        </View>
      ) : null}
      <View className="mt-7 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-ink">{results.length} professionals found</Text>
        <Text className="font-semibold text-brand">Top rated</Text>
      </View>

      {isLoading ? (
        <View className="mt-10 items-center gap-3">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="text-slate-500">Loading professionals…</Text>
        </View>
      ) : isError ? (
        <View className="mt-10 items-center gap-4 rounded-3xl bg-white p-6">
          <Text className="text-base text-slate-500">We couldn’t load professionals right now.</Text>
          <Pressable onPress={() => refetch()} className="rounded-2xl bg-brand px-6 py-3">
            <Text className="font-bold text-white">Try again</Text>
          </Pressable>
        </View>
      ) : results.length === 0 ? (
        <View className="mt-10 items-center gap-3 rounded-3xl bg-white p-6">
          <Text className="text-lg font-bold text-ink">No professionals found</Text>
          <Text className="text-center text-base leading-6 text-slate-500">
            Try a different search or clear your filters. New builders appear here once verified.
          </Text>
        </View>
      ) : (
        <View className="mt-3 gap-3">
          {results.map((builder) => (
            <Pressable
              key={builder.id}
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
          ))}
        </View>
      )}
    </Screen>
  );
}
