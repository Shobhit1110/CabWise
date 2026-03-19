import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useThemeStore, spacing, radii, typography } from '../../store/themeStore';
import { usePressAnimation } from '../../utils/animations';
import { triggerHaptic } from '../../utils/haptics';

interface ScheduleSheetProps {
  visible: boolean;
  onClose: () => void;
  onSchedule: (time: Date) => void;
  onRideNow: () => void;
  currentSchedule: Date | null;
}

/* ── helpers ────────────────────────────────────── */

const DAYS_AHEAD = 7;

function pad(n: number) { return n.toString().padStart(2, '0'); }
function fmt12(h: number) { return h % 12 || 12; }
function period(h: number) { return h >= 12 ? 'PM' : 'AM'; }

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function shortDay(d: Date, now: Date) {
  if (sameDay(d, now)) return 'Today';
  const tmr = new Date(now); tmr.setDate(tmr.getDate() + 1);
  if (sameDay(d, tmr)) return 'Tmrw';
  return d.toLocaleDateString('en-GB', { weekday: 'short' });
}

function longDay(d: Date, now: Date) {
  if (sameDay(d, now)) return 'Today';
  const tmr = new Date(now); tmr.setDate(tmr.getDate() + 1);
  if (sameDay(d, tmr)) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function generateDays(): Date[] {
  const now = new Date();
  return Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

function timeSlots(day: Date, now: Date): { label: string; hour: number; min: number }[] {
  const isToday = sameDay(day, now);
  let h: number, m: number;

  if (isToday) {
    const next = Math.ceil(now.getMinutes() / 15) * 15 + 15;
    h = now.getHours() + Math.floor(next / 60);
    m = next % 60;
  } else {
    h = 6; m = 0;
  }

  const slots: { label: string; hour: number; min: number }[] = [];
  while (h < 24 && slots.length < 16) {
    slots.push({ label: `${fmt12(h)}:${pad(m)}`, hour: h, min: m });
    m += 15;
    if (m >= 60) { m = 0; h++; }
  }
  return slots;
}

/* ── Pill button ───────────────────────────────── */

function Pill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors } = useThemeStore();
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[
          styles.pill,
          { backgroundColor: selected ? colors.text : colors.chipBg },
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Text style={[styles.pillText, { color: selected ? colors.bg : colors.textSecondary }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/* ── Stepper (for custom time) ─────────────────── */

function Stepper({ value, label, onUp, onDown }: { value: string; label: string; onUp: () => void; onDown: () => void }) {
  const { colors } = useThemeStore();
  return (
    <View style={styles.stepper}>
      <Text style={[styles.stepperLabel, { color: colors.textMuted }]}>{label}</Text>
      <View style={[styles.stepperBox, { backgroundColor: colors.chipBg }]}>
        <Pressable onPress={onUp} hitSlop={8} style={styles.stepperBtn}>
          <Text style={[styles.stepperArrow, { color: colors.textSecondary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.stepperValue, { color: colors.text }]}>{value}</Text>
        <Pressable onPress={onDown} hitSlop={8} style={styles.stepperBtn}>
          <Text style={[styles.stepperArrow, { color: colors.textSecondary }]}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ── main ───────────────────────────────────────── */

export function ScheduleSheet({ visible, onClose, onSchedule, onRideNow, currentSchedule }: ScheduleSheetProps) {
  const { colors } = useThemeStore();
  const now = useMemo(() => new Date(), [visible]);
  const days = useMemo(() => generateDays(), [visible]);

  const [selectedDay, setSelectedDay] = useState<Date>(days[0]);
  const [customMode, setCustomMode] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ hour: number; min: number } | null>(null);

  const isToday = sameDay(selectedDay, now);
  const minH = isToday ? now.getHours() : 0;
  const [cHour, setCHour] = useState(isToday ? Math.min(now.getHours() + 1, 23) : 9);
  const [cMin, setCMin] = useState(0);

  const slots = useMemo(() => timeSlots(selectedDay, now), [selectedDay, now]);

  const buildDate = useCallback((h: number, m: number) => {
    const d = new Date(selectedDay);
    d.setHours(h, m, 0, 0);
    return d;
  }, [selectedDay]);

  const finalDate = useMemo(() => {
    if (customMode) return buildDate(cHour, cMin);
    if (selectedSlot) return buildDate(selectedSlot.hour, selectedSlot.min);
    return null;
  }, [customMode, cHour, cMin, selectedSlot, buildDate]);

  const handleDayChange = (day: Date) => {
    setSelectedDay(day);
    setSelectedSlot(null);
    setCustomMode(false);
    const td = sameDay(day, now);
    setCHour(td ? Math.min(now.getHours() + 1, 23) : 9);
    setCMin(0);
  };

  const handleConfirm = () => {
    if (finalDate) { triggerHaptic('success'); onSchedule(finalDate); onClose(); }
  };

  const handleRideNow = () => {
    triggerHaptic('light'); onRideNow(); onClose();
  };

  const stepHour = (dir: 1 | -1) => {
    setCHour((h) => { const n = h + dir; return n < minH ? 23 : n > 23 ? minH : n; });
    triggerHaptic('light');
  };
  const stepMin = (dir: 1 | -1) => {
    setCMin((m) => { const n = m + dir * 5; return n < 0 ? 55 : n > 55 ? 0 : n; });
    triggerHaptic('light');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.bg }]} onPress={(e) => e.stopPropagation()}>

          {/* Handle */}
          <View style={styles.handle}>
            <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
          </View>

          {/* Header row */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>When?</Text>
            </View>
            <Pressable style={[styles.nowPill, { backgroundColor: colors.chipBg }]} onPress={handleRideNow}>
              <Text style={[styles.nowText, { color: colors.accent }]}>Now</Text>
            </Pressable>
          </View>

          {/* Date pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRow} contentContainerStyle={styles.dateRowInner}>
            {days.map((d) => {
              const sel = sameDay(d, selectedDay);
              return (
                <Pressable
                  key={d.toISOString()}
                  style={[styles.dateChip, sel && { backgroundColor: colors.text }]}
                  onPress={() => { triggerHaptic('light'); handleDayChange(d); }}
                >
                  <Text style={[styles.dateChipDay, { color: sel ? colors.bg : colors.textMuted }]}>{shortDay(d, now)}</Text>
                  <Text style={[styles.dateChipNum, { color: sel ? colors.bg : colors.text }]}>{d.getDate()}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Time toggle */}
          <View style={styles.timeHeader}>
            <Text style={[styles.timeLabel, { color: colors.textMuted }]}>
              {customMode ? 'Set exact time' : 'Pick a time'}
            </Text>
            <Pressable hitSlop={12} onPress={() => { triggerHaptic('light'); setCustomMode(!customMode); setSelectedSlot(null); }}>
              <Text style={[styles.toggleText, { color: colors.accent }]}>
                {customMode ? 'Show grid' : 'Exact time'}
              </Text>
            </Pressable>
          </View>

          {customMode ? (
            <View style={styles.customRow}>
              <Stepper value={`${fmt12(cHour)}`} label="Hour" onUp={() => stepHour(-1)} onDown={() => stepHour(1)} />
              <Text style={[styles.colonSep, { color: colors.text }]}>:</Text>
              <Stepper value={pad(cMin)} label="Min" onUp={() => stepMin(-1)} onDown={() => stepMin(1)} />
              <View style={styles.stepper}>
                <Text style={[styles.stepperLabel, { color: colors.textMuted }]}>{' '}</Text>
                <Pressable
                  style={[styles.ampmBox, { backgroundColor: colors.chipBg }]}
                  onPress={() => { setCHour(h => h >= 12 ? h - 12 : h + 12); triggerHaptic('light'); }}
                >
                  <Text style={[styles.ampmText, { color: colors.text }]}>{period(cHour)}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <ScrollView style={styles.grid} contentContainerStyle={styles.gridInner} showsVerticalScrollIndicator={false}>
              {slots.map((s, i) => {
                const sel = selectedSlot?.hour === s.hour && selectedSlot?.min === s.min;
                return (
                  <Pill
                    key={i}
                    label={`${s.label} ${period(s.hour)}`}
                    selected={sel}
                    onPress={() => { triggerHaptic('light'); setSelectedSlot({ hour: s.hour, min: s.min }); }}
                  />
                );
              })}
            </ScrollView>
          )}

          {/* Confirm footer */}
          {finalDate && (
            <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
              <View style={styles.footerLeft}>
                <Text style={[styles.footerDay, { color: colors.text }]}>{longDay(finalDate, now)}</Text>
                <Text style={[styles.footerTime, { color: colors.textMuted }]}>
                  {fmt12(finalDate.getHours())}:{pad(finalDate.getMinutes())} {period(finalDate.getHours())}
                </Text>
              </View>
              <Pressable style={[styles.confirmBtn, { backgroundColor: colors.text }]} onPress={handleConfirm}>
                <Text style={[styles.confirmText, { color: colors.bg }]}>Confirm</Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ── styles ─────────────────────────────────────── */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'web' ? spacing.xl : 36,
  },
  handle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  nowPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  nowText: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* Date pills */
  dateRow: {
    marginBottom: spacing.md,
    maxHeight: 64,
  },
  dateRowInner: {
    gap: 8,
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: 52,
  },
  dateChipDay: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  dateChipNum: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 1,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },

  /* Time header */
  timeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* Grid */
  grid: {
    maxHeight: 180,
  },
  gridInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: spacing.sm,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* Custom stepper */
  customRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.lg,
  },
  stepper: {
    alignItems: 'center',
    gap: 6,
  },
  stepperLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 2,
  },
  stepperBtn: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperArrow: {
    fontSize: 22,
    fontWeight: '300',
  },
  stepperValue: {
    fontSize: 22,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'center',
  },
  colonSep: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  ampmBox: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ampmText: {
    fontSize: 16,
    fontWeight: '700',
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  footerLeft: {
    gap: 1,
  },
  footerDay: {
    fontSize: 15,
    fontWeight: '600',
  },
  footerTime: {
    fontSize: 13,
    fontWeight: '500',
  },
  confirmBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
