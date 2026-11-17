import { router } from 'expo-router';
import { ChevronLeft, FileText, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { AppButton } from '@/shared/components/app-button';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';
import { paymentService, type PaymentProvider } from '@/features/payments/services/payment-service';
import { useThemeColors } from '@/shared/theme';

const options: { id: PaymentProvider; label: string }[] = [
  { id: 'paychangu', label: 'PayChangu' },
  { id: 'airtel_money', label: 'Airtel Money' },
  { id: 'tnm_mpamba', label: 'TNM Mpamba' },
  { id: 'bank_transfer', label: 'Bank transfer' },
];

export default function Payments() {
  const colors = useThemeColors();
  const [provider, setProvider] = useState<PaymentProvider>('paychangu');
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    setLoading(true);
    try {
      const result = await paymentService.createPayment({
        bookingId: 'demo-booking',
        amountMwk: 50000,
        provider,
        customerEmail: 'member@builderlink.mw',
      });
      Alert.alert('Payment initiated', `Reference: ${result.reference}\nYou will be redirected to complete payment securely.`);
    } catch {
      Alert.alert('Payment failed', 'We couldn’t start your payment. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Protected>
      <Screen>
        <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface">
          <ChevronLeft color={colors.ink} />
        </Pressable>
        <Text className="mt-6 text-3xl font-bold text-ink">Pay deposit</Text>
        <Text className="mt-2 text-muted">Booking with Thoko Mbewe</Text>

        <View className="mt-7 rounded-2xl border border-line bg-surface p-5">
          <Text className="text-sm text-muted">Deposit due</Text>
          <Text className="mt-1 text-3xl font-bold text-ink">MWK 50,000</Text>
          <Text className="mt-2 text-sm text-muted">Your payment is held against this booking.</Text>
        </View>

        <Text className="mt-8 text-lg font-bold text-ink">Choose payment method</Text>
        <View className="mt-3 gap-3">
          {options.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => setProvider(option.id)}
              className={`rounded-xl border p-4 ${provider === option.id ? 'border-ink bg-subtle' : 'border-line bg-surface'}`}
            >
              <Text className="font-bold text-ink">{option.label}</Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-6 flex-row gap-3 rounded-xl bg-success-soft p-4">
          <ShieldCheck color={colors.success} size={22} />
          <Text className="flex-1 leading-5 text-success">Payments are processed securely. Builder payouts are released after job completion.</Text>
        </View>

        <View className="mt-7 gap-3">
          <AppButton label="Continue to secure payment" loading={loading} onPress={pay} />
          <Pressable onPress={() => Alert.alert('Receipt preview', 'A detailed receipt will be available after payment is confirmed.')} className="flex-row items-center justify-center gap-2 py-2">
            <FileText size={18} color={colors.brand} />
            <Text className="font-semibold text-brand">View receipt details</Text>
          </Pressable>
        </View>
      </Screen>
    </Protected>
  );
}
