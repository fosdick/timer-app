import { View, StyleSheet } from "react-native";
import { CLICK_SOUNDS, AMBIENCES, getClickSound } from "./breath-sounds";
import { WheelSelect } from "./WheelSelect";
import { breathTheme as t } from "./breath-theme";

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
}: {
  clickId: string;
  ambienceId: string;
  onClickChange: (id: string) => void;
  onAmbienceChange: (id: string) => void;
  disabled?: boolean;
}) {
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

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: t.space.sm },
});
