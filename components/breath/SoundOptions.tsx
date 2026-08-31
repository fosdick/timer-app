import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { CLICK_SOUNDS, AMBIENCES, getClickSound } from "./breath-sounds";
import { WheelSelect } from "./WheelSelect";
import { useBreathTheme, type BreathTheme } from "./breath-theme";

/**
 * Click-sound and ambience selectors — one compact row of two wheel-select
 * fields (the option lists outgrew a chip per option). The click wheel previews
 * each sound as the wheel settles on it.
 */
export function SoundOptions({
  clickId,
  ambienceId,
  onClickChange,
  onAmbienceChange,
  disabled,
  downbeatId,
  onDownbeatChange,
  downbeatDisabled,
}: {
  clickId: string;
  ambienceId: string;
  onClickChange: (id: string) => void;
  onAmbienceChange: (id: string) => void;
  disabled?: boolean;
  /** When provided, shows the Downbeat wheel between Click and Ambience. */
  downbeatId?: string;
  onDownbeatChange?: (id: string) => void;
  /** Greys the Downbeat wheel when downbeats are toggled off for the pattern. */
  downbeatDisabled?: boolean;
}) {
  const t = useBreathTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const showDownbeat = downbeatId !== undefined && onDownbeatChange !== undefined;
  return (
    <View style={styles.row}>
      <WheelSelect
        label="Click"
        options={CLICK_SOUNDS}
        selectedId={clickId}
        onChange={onClickChange}
        onSettle={(id) => getClickSound(id).play()}
        disabled={disabled}
      />
      {showDownbeat && (
        <WheelSelect
          label="Downbeat"
          options={CLICK_SOUNDS}
          selectedId={downbeatId}
          onChange={onDownbeatChange}
          onSettle={(id) => getClickSound(id).play()}
          disabled={disabled || downbeatDisabled}
          muted={downbeatDisabled}
        />
      )}
      <WheelSelect
        label="Ambience"
        options={AMBIENCES}
        selectedId={ambienceId}
        onChange={onAmbienceChange}
        disabled={disabled}
      />
    </View>
  );
}

const makeStyles = (t: BreathTheme) =>
  StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: t.space.sm },
});
