import { Hammer } from 'lucide-react-native';
import { View } from 'react-native';

/** The BuilderLink logo tile. The one place the brand colour is used as a solid fill. */
export function BrandMark() {
  return (
    <View className="h-12 w-12 items-center justify-center rounded-xl bg-brand">
      <Hammer size={24} color="#FFFFFF" strokeWidth={2.25} />
    </View>
  );
}
