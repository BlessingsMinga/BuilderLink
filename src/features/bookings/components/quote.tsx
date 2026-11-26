import { Plus, X } from 'lucide-react-native';
import { Pressable, Text, TextInput, View } from 'react-native';
import { FormField } from '@/shared/components/form-field';
import { useThemeColors } from '@/shared/theme';
import { MAX_QUOTE_ITEMS, formatMoney, type Quote, type QuoteItem } from '../services/booking-service';

/** One editable quote line; the amount is kept as typed until submitted. */
export type QuoteDraftLine = { label: string; amount: string };

export const emptyQuoteLine = (): QuoteDraftLine => ({ label: '', amount: '' });

export function quoteToDraft(quote: Quote | null): QuoteDraftLine[] {
  return quote ? quote.items.map((item) => ({ label: item.label, amount: String(item.amount) })) : [emptyQuoteLine()];
}

const parseAmount = (text: string): number | null => {
  const cleaned = text.replace(/[\s,]/g, '');
  if (!/^\d+$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return value <= 1_000_000_000 ? value : null;
};

/**
 * Turn the draft into quote items, ignoring fully empty lines.
 * Returns an error message when a line is half filled or a price is not a whole number.
 */
export function parseQuoteDraft(lines: QuoteDraftLine[]): { items: QuoteItem[] } | { error: string } {
  const items: QuoteItem[] = [];
  for (const [index, line] of lines.entries()) {
    const label = line.label.trim();
    if (!label && !line.amount.trim()) continue;
    if (!label) return { error: `Line ${index + 1}: describe what the price is for.` };
    const amount = parseAmount(line.amount);
    if (amount === null) return { error: `Line ${index + 1}: enter the price as a whole number of kwacha, e.g. 150000.` };
    items.push({ label, amount });
  }
  return { items };
}

/** Running total of the lines that already have a valid price. */
function draftTotal(lines: QuoteDraftLine[]): number {
  return lines.reduce((sum, line) => sum + (parseAmount(line.amount) ?? 0), 0);
}

type EditorProps = {
  lines: QuoteDraftLine[];
  onChangeLines: (lines: QuoteDraftLine[]) => void;
  note: string;
  onChangeNote: (note: string) => void;
};

/** Itemised price list the builder fills in: labour, materials, transport… */
export function QuoteEditor({ lines, onChangeLines, note, onChangeNote }: EditorProps) {
  const colors = useThemeColors();
  const update = (index: number, change: Partial<QuoteDraftLine>) =>
    onChangeLines(lines.map((line, i) => (i === index ? { ...line, ...change } : line)));
  const remove = (index: number) =>
    onChangeLines(lines.length === 1 ? [emptyQuoteLine()] : lines.filter((_, i) => i !== index));

  return (
    <View className="gap-3">
      <Text className="font-medium text-sm text-ink">Price breakdown</Text>
      {lines.map((line, index) => (
        <View key={index} className="flex-row items-center gap-2">
          <TextInput
            accessibilityLabel={`Line ${index + 1} description`}
            value={line.label}
            onChangeText={(label) => update(index, { label })}
            placeholder={index === 0 ? 'e.g. Labour' : 'e.g. Materials'}
            placeholderTextColor={colors.faint}
            maxLength={80}
            className="flex-[3] rounded-xl border border-line bg-surface px-3 py-2.5 font-body text-sm text-ink"
          />
          <TextInput
            accessibilityLabel={`Line ${index + 1} price in kwacha`}
            value={line.amount}
            onChangeText={(amount) => update(index, { amount })}
            placeholder="MWK"
            placeholderTextColor={colors.faint}
            keyboardType="number-pad"
            maxLength={13}
            className="flex-[2] rounded-xl border border-line bg-surface px-3 py-2.5 font-body text-sm text-ink"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove line ${index + 1}`}
            hitSlop={8}
            onPress={() => remove(index)}
            className="p-1 active:opacity-60"
          >
            <X size={18} color={colors.muted} />
          </Pressable>
        </View>
      ))}
      {lines.length < MAX_QUOTE_ITEMS ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onChangeLines([...lines, emptyQuoteLine()])}
          className="flex-row items-center gap-1.5 self-start py-1 active:opacity-60"
        >
          <Plus size={16} color={colors.brand} />
          <Text className="font-semibold text-sm text-brand">Add a line</Text>
        </Pressable>
      ) : null}
      <View className="flex-row justify-between border-t border-line pt-3">
        <Text className="font-semibold text-base text-ink">Total</Text>
        <Text accessibilityLiveRegion="polite" className="font-semibold text-base text-ink">
          {formatMoney(draftTotal(lines))}
        </Text>
      </View>
      <FormField
        label="Note for the customer (optional)"
        value={note}
        onChangeText={onChangeNote}
        multiline
        placeholder="e.g. Price includes cement and sand. Valid for 14 days."
        maxLength={500}
      />
    </View>
  );
}

/** Read-only view of a quote, as shown on the booking. */
export function QuoteSummary({ quote, title }: { quote: Quote; title: string }) {
  return (
    <View className="rounded-[20px] border border-line bg-surface p-4">
      <Text className="mb-3 font-heading text-base text-ink">{title}</Text>
      <View className="gap-2">
        {quote.items.map((item, index) => (
          <View key={index} className="flex-row justify-between gap-4">
            <Text className="flex-1 font-body text-sm text-ink">{item.label}</Text>
            <Text className="font-body text-sm text-ink">{formatMoney(item.amount)}</Text>
          </View>
        ))}
      </View>
      <View className="mt-3 flex-row justify-between border-t border-line pt-3">
        <Text className="font-semibold text-base text-ink">Total</Text>
        <Text className="font-semibold text-base text-ink">{formatMoney(quote.total)}</Text>
      </View>
      {quote.note ? <Text className="mt-3 font-body text-sm text-muted">“{quote.note}”</Text> : null}
    </View>
  );
}
