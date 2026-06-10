import { useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { breathTheme as t } from "./breath-theme";

export interface WheelOption {
  id: string;
  label: string;
}

const ITEM_H = 42;
const VISIBLE = 5; // odd, so one row sits centered

/**
 * A compact labeled value that opens a scroll-wheel modal over named options —
 * the date-picker feel of the count editors, but for strings. Pure JS (no
 * native picker dependency), and it scales to any option count without eating
 * a screen row per option like a chip-per-option UI.
 */
export function WheelSelect({
  label,
  options,
  selectedId,
  onChange,
  onSettle,
  disabled = false,
}: {
  label: string;
  options: WheelOption[];
  selectedId: string;
  onChange: (id: string) => void;
  /** Fires when the wheel settles on a new option (e.g. preview its sound). */
  onSettle?: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const settledIdx = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const openIdx = useRef(0);

  const current = options.find((o) => o.id === selectedId) ?? options[0];

  const openWheel = () => {
    const i = Math.max(
      0,
      options.findIndex((o) => o.id === selectedId),
    );
    openIdx.current = i;
    settledIdx.current = i;
    setIdx(i);
    setOpen(true);
  };

  const indexFromOffset = (y: number) =>
    Math.min(options.length - 1, Math.max(0, Math.round(y / ITEM_H)));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIdx(indexFromOffset(e.nativeEvent.contentOffset.y));

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = indexFromOffset(e.nativeEvent.contentOffset.y);
    setIdx(i);
    if (i !== settledIdx.current) {
      settledIdx.current = i;
      onSettle?.(options[i].id);
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled}
        onPress={openWheel}
        style={styles.field}
      >
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{current.label}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.card}>
            <Text style={styles.title}>{label}</Text>

            <View style={styles.wheelWrap}>
              <View pointerEvents="none" style={styles.centerBand} />
              <ScrollView
                ref={scrollRef}
                snapToInterval={ITEM_H}
                decelerationRate="fast"
                showsVerticalScrollIndicator={false}
                contentOffset={{ x: 0, y: openIdx.current * ITEM_H }}
                onLayout={() =>
                  scrollRef.current?.scrollTo({ y: openIdx.current * ITEM_H, animated: false })
                }
                contentContainerStyle={{ paddingVertical: (ITEM_H * (VISIBLE - 1)) / 2 }}
                onScroll={onScroll}
                scrollEventThrottle={16}
                onMomentumScrollEnd={onMomentumEnd}
              >
                {options.map((o, i) => (
                  <TouchableOpacity
                    key={o.id}
                    activeOpacity={0.7}
                    style={styles.item}
                    onPress={() => scrollRef.current?.scrollTo({ y: i * ITEM_H, animated: true })}
                  >
                    <Text style={[styles.itemText, i === idx && styles.itemTextActive]}>
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setOpen(false)}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  onChange(options[idx].id);
                  setOpen(false);
                }}
              >
                <Text style={styles.confirm}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    alignItems: "center",
    minWidth: 96,
    paddingVertical: t.space.xs,
    paddingHorizontal: t.space.sm,
    borderRadius: t.radius,
    borderWidth: 1,
    borderColor: t.line,
  },
  fieldLabel: { color: t.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldValue: { color: t.text, fontSize: 18, fontWeight: "400", marginTop: 3 },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: t.surface,
    borderColor: t.line,
    borderWidth: 1,
    borderRadius: t.radius + 4,
    paddingVertical: t.space.md,
    paddingHorizontal: t.space.lg,
    minWidth: 240,
    alignItems: "center",
  },
  title: { color: t.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
  wheelWrap: { height: ITEM_H * VISIBLE, alignSelf: "stretch", marginVertical: t.space.sm },
  centerBand: {
    position: "absolute",
    top: (ITEM_H * (VISIBLE - 1)) / 2,
    left: 0,
    right: 0,
    height: ITEM_H,
    borderRadius: t.radius,
    backgroundColor: t.tintFaint,
  },
  item: { height: ITEM_H, justifyContent: "center", alignItems: "center" },
  itemText: { color: t.muted, fontSize: 18, fontWeight: "300" },
  itemTextActive: { color: t.accent, fontWeight: "600" },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "stretch",
    paddingHorizontal: t.space.sm,
  },
  cancel: { color: t.muted, fontSize: 16, padding: t.space.xs },
  confirm: { color: t.accent, fontSize: 16, fontWeight: "600", padding: t.space.xs },
});
