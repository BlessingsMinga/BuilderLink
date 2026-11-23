import { Image, View } from 'react-native';

const logo = require('../../../assets/images/logo.png');

/** The BuilderLink logo tile. Pass `onHero` when it sits on the coloured hero band. */
export function BrandMark({ onHero = false }: { onHero?: boolean }) {
  return (
    <View
      className={`h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white ${onHero ? '' : 'border border-black/10'}`}
    >
      <Image source={logo} style={{ width: 52, height: 49 }} resizeMode="contain" />
    </View>
  );
}
