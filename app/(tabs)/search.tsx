import { useLocalSearchParams } from 'expo-router';
import { Search as SearchIcon, SearchX, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { BuilderCard } from '@/features/builders/components/builder-card';
import { useBuilders } from '@/features/builders/hooks/use-builders';
import { MALAWI_DISTRICTS } from '@/features/builders/services/builder-service';
import { Chip } from '@/shared/components/chip';
import { Screen } from '@/shared/components/screen';
import { ListSkeleton } from '@/shared/components/skeleton';
import { EmptyState, ErrorState } from '@/shared/components/states';
import { useThemeColors } from '@/shared/theme';

export default function Search() {
  const colors = useThemeColors();
  // `q` may be supplied when browsing by trade from the Home screen.
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(q ?? '');
  const [district, setDistrict] = useState<string | null>(null);

  // Keep the search box in sync when navigated to with a new trade query.
  useEffect(() => {
    setQuery(q ?? '');
  }, [q]);

  const { data: builders = [], isLoading, isError, error, refetch, isRefetching } = useBuilders();

  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    return builders.filter(
      (builder) =>
        (!district || builder.district === district) &&
        (!text || `${builder.name} ${builder.trades.join(' ')}`.toLowerCase().includes(text)),
    );
  }, [builders, district, query]);

  const hasFilters = Boolean(query.trim() || district);
  const clearFilters = () => {
    setQuery('');
    setDistrict(null);
  };

  return (
    <Screen
      refreshing={isRefetching}
      onRefresh={refetch}
      hero={
        <>
          <Text className="font-heading text-3xl text-white">Search</Text>
          <View className="mt-4 h-14 flex-row items-center gap-3 rounded-2xl bg-surface px-4">
            <SearchIcon size={20} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              className="h-14 flex-1 font-body text-base text-ink"
              placeholder="Search a trade or name"
              placeholderTextColor={colors.faint}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query ? (
              <Pressable accessibilityLabel="Clear search" hitSlop={12} onPress={() => setQuery('')}>
                <X size={20} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        </>
      }
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 flex-grow-0" contentContainerClassName="gap-2 px-5">
        <Chip label="All districts" selected={!district} onPress={() => setDistrict(null)} />
        {MALAWI_DISTRICTS.map((item) => (
          <Chip key={item} label={item} selected={district === item} onPress={() => setDistrict(item)} />
        ))}
      </ScrollView>

      {isLoading ? (
        <View className="mt-6">
          <ListSkeleton count={4} />
        </View>
      ) : isError ? (
        <View className="mt-6">
          <ErrorState error={error} what="professionals" onRetry={() => refetch()} />
        </View>
      ) : results.length === 0 ? (
        <View className="mt-6">
          <EmptyState
            icon={<SearchX size={26} color={colors.brand} />}
            message={
              hasFilters
                ? 'No professionals match your search. Try a different trade or district.'
                : 'No verified professionals yet. Check back soon.'
            }
            actionLabel={hasFilters ? 'Clear filters' : undefined}
            onAction={clearFilters}
          />
        </View>
      ) : (
        <>
          <View className="mb-3 mt-6 flex-row items-center justify-between">
            <Text className="font-semibold text-sm text-muted">
              {results.length} {results.length === 1 ? 'professional' : 'professionals'}
            </Text>
            {hasFilters ? (
              <Pressable hitSlop={12} onPress={clearFilters}>
                <Text className="font-semibold text-sm text-brand">Clear filters</Text>
              </Pressable>
            ) : null}
          </View>
          <View className="gap-3">
            {results.map((builder) => (
              <BuilderCard key={builder.id} builder={builder} />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
