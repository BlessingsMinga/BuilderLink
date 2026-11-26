import { BadgeCheck, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Image, Modal, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderButton } from '@/shared/components/screen-header';
import type { PortfolioPhoto } from '../services/portfolio-service';

export const KIND_LABELS = { before: 'Before', after: 'After' } as const;

/** Small "Before" / "After" pill shown on tiles and in the viewer. */
export function KindBadge({ kind }: { kind: PortfolioPhoto['kind'] }) {
  if (!kind) return null;
  return (
    <View className={`rounded-md px-2 py-0.5 ${kind === 'after' ? 'bg-primary' : 'bg-black/70'}`}>
      <Text className="font-bold text-[11px] uppercase tracking-wide text-white">{KIND_LABELS[kind]}</Text>
    </View>
  );
}

type Props = {
  photos: PortfolioPhoto[];
  /** Index of the photo to open, or null when closed. */
  openIndex: number | null;
  onClose: () => void;
};

/** Full-screen gallery: swipe between photos, with caption and job details. */
export function PhotoViewer({ photos, openIndex, onClose }: Props) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(openIndex ?? 0);
  const list = useRef<FlatList<PortfolioPhoto>>(null);

  useEffect(() => {
    if (openIndex !== null) setIndex(openIndex);
  }, [openIndex]);

  const current = photos[index];

  return (
    <Modal visible={openIndex !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        <SafeAreaView edges={['top']} className="flex-row items-center justify-between px-4 py-2">
          <Text className="font-semibold text-sm text-white">
            {photos.length > 1 ? `${index + 1} of ${photos.length}` : ''}
          </Text>
          <HeaderButton onHero label="Close photo" onPress={onClose}>
            <X size={22} color="#FFFFFF" />
          </HeaderButton>
        </SafeAreaView>
        {openIndex !== null ? (
          <FlatList
            ref={list}
            data={photos}
            keyExtractor={(photo) => photo.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={openIndex}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => (
              <View style={{ width }} className="flex-1">
                <Image
                  source={{ uri: item.url }}
                  resizeMode="contain"
                  className="flex-1"
                  accessibilityLabel={item.caption ? `Work photo: ${item.caption}` : 'Work photo'}
                />
              </View>
            )}
          />
        ) : null}
        {current ? (
          <SafeAreaView edges={['bottom']} className="gap-2 px-5 pb-4 pt-3">
            <View className="flex-row flex-wrap items-center gap-2">
              <KindBadge kind={current.kind} />
              {current.bookingId ? (
                <View className="flex-row items-center gap-1">
                  <BadgeCheck size={16} color="#FFFFFF" />
                  <Text className="font-semibold text-xs text-white">
                    Job done on BuilderLink{current.service ? ` · ${current.service}` : ''}
                  </Text>
                </View>
              ) : null}
            </View>
            {current.caption ? <Text className="font-body text-base text-white">{current.caption}</Text> : null}
          </SafeAreaView>
        ) : null}
      </View>
    </Modal>
  );
}
