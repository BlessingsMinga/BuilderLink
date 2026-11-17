import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { formatBookingDate, toIsoDate } from '../services/booking-service';
import { Chip } from '@/shared/components/chip';
import { useThemeColors } from '@/shared/theme';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** Today, tomorrow, and the coming Saturday (or today, if it's already the weekend). */
function quickOptions(today: Date) {
  const weekday = today.getDay(); // 0 = Sunday
  const weekend = weekday === 0 || weekday === 6 ? today : addDays(today, 6 - weekday);
  return [
    { label: 'Today', iso: toIsoDate(today) },
    { label: 'Tomorrow', iso: toIsoDate(addDays(today, 1)) },
    { label: 'This weekend', iso: toIsoDate(weekend) },
  ];
}

type Props = {
  /** Selected date as ISO `YYYY-MM-DD`, or null. */
  value: string | null;
  onChange: (isoDate: string) => void;
};

/** Date chooser: quick options plus a month calendar. Past days can't be picked. */
export function DateField({ value, onChange }: Props) {
  const colors = useThemeColors();
  const today = new Date();
  const todayIso = toIsoDate(today);
  const options = quickOptions(today);
  const isQuickPick = options.some((option) => option.iso === value);

  const [calendarOpen, setCalendarOpen] = useState(false);
  // First day of the month the calendar is showing.
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  // Blank cells before the 1st so the grid starts on Monday.
  const leadingBlanks = (month.getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <View>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option.label}
            label={option.label}
            // Two options can land on the same day (e.g. "Today" on a Saturday); highlight only the first.
            selected={options.find((candidate) => candidate.iso === value)?.label === option.label && !calendarOpen}
            onPress={() => {
              onChange(option.iso);
              setCalendarOpen(false);
            }}
          />
        ))}
        <Chip
          label={value && !isQuickPick ? formatBookingDate(value) : 'Pick a date'}
          selected={calendarOpen || Boolean(value && !isQuickPick)}
          onPress={() => setCalendarOpen((open) => !open)}
        />
      </View>

      {calendarOpen ? (
        <View className="mt-3 rounded-2xl border border-line p-3">
          <View className="flex-row items-center justify-between">
            <Pressable
              accessibilityLabel="Previous month"
              disabled={isCurrentMonth}
              onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className={`h-12 w-12 items-center justify-center rounded-full ${isCurrentMonth ? 'opacity-30' : 'active:bg-subtle'}`}
            >
              <ChevronLeft color={colors.ink} size={20} />
            </Pressable>
            <Text className="font-semibold text-base text-ink">
              {month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </Text>
            <Pressable
              accessibilityLabel="Next month"
              onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className="h-12 w-12 items-center justify-center rounded-full active:bg-subtle"
            >
              <ChevronRight color={colors.ink} size={20} />
            </Pressable>
          </View>

          <View className="mt-1 flex-row">
            {WEEKDAYS.map((weekday, index) => (
              <Text key={index} className="flex-1 text-center font-medium text-xs text-faint">
                {weekday}
              </Text>
            ))}
          </View>

          <View className="mt-1 flex-row flex-wrap">
            {cells.map((day, index) => {
              if (day === null) return <View key={index} className="h-11 w-[14.28%]" />;
              const iso = toIsoDate(new Date(month.getFullYear(), month.getMonth(), day));
              const isPast = iso < todayIso;
              const selected = iso === value;
              return (
                <Pressable
                  key={index}
                  disabled={isPast}
                  accessibilityLabel={formatBookingDate(iso)}
                  accessibilityState={{ selected, disabled: isPast }}
                  onPress={() => {
                    onChange(iso);
                    setCalendarOpen(false);
                  }}
                  className="h-11 w-[14.28%] items-center justify-center"
                >
                  <View className={`h-9 w-9 items-center justify-center rounded-full ${selected ? 'bg-ink' : iso === todayIso ? 'border border-line' : ''}`}>
                    <Text className={`text-sm ${selected ? 'font-semibold text-canvas' : isPast ? 'font-body text-faint' : 'font-body text-ink'}`}>
                      {day}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {value ? <Text className="mt-3 font-body text-sm text-muted">Preferred date: {formatBookingDate(value)}</Text> : null}
    </View>
  );
}
