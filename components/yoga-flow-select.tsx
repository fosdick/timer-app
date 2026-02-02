import { useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet, ScrollView, TextInput } from "react-native";
import { YOGA_FLOWS, YogaFlow, calculateFlowDurationWithTransitions } from "@/assets/data/yoga-flows";
import { colorTheme } from "@/assets/styles/timer-app";
import { formatMinutesSeconds, getTimePartsMinSec } from "@/assets/utils/format-time";

interface YogaFlowSelectProps {
  onSelectFlow: (flow: YogaFlow, durationMultiplier: number) => void;
  onSelectManual: () => void;
  onCancel: () => void;
}

export default function YogaFlowSelect({ onSelectFlow, onSelectManual, onCancel }: YogaFlowSelectProps) {
  const [multiplierText, setMultiplierText] = useState<string>("1");

  const parsedMultiplier = parseFloat(multiplierText);
  const durationMultiplier = !isNaN(parsedMultiplier) && parsedMultiplier > 0 ? parsedMultiplier : 1;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Flow</Text>

      {/* Duration Multiplier */}
      <View style={styles.multiplierContainer}>
        <Text style={styles.multiplierLabel}>Duration Multiplier</Text>
        <View style={styles.multiplierInputRow}>
          <TextInput
            style={styles.multiplierInput}
            value={multiplierText}
            onChangeText={setMultiplierText}
            keyboardType="decimal-pad"
            placeholder="1"
            placeholderTextColor={colorTheme.borderColor}
            selectTextOnFocus
          />
          <Text style={styles.multiplierX}>x</Text>
          {durationMultiplier !== 1 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setMultiplierText("1")}
              style={styles.multiplierResetButton}
            >
              <Text style={styles.multiplierResetText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.flowList} contentContainerStyle={styles.flowListContent}>
        {/* Manual Timer Option */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSelectManual}
          style={styles.flowCard}
        >
          <Text style={styles.flowName}>Manual Timer</Text>
          <Text style={styles.flowDescription}>Simple countdown timer - set your own duration</Text>
          <Text style={styles.flowDuration}>Tap timer to set duration</Text>
        </TouchableOpacity>

        {/* Predefined Flows */}
        {YOGA_FLOWS.map((flow) => (
          <TouchableOpacity
            key={flow.id}
            activeOpacity={0.7}
            onPress={() => onSelectFlow(flow, durationMultiplier)}
            style={styles.flowCard}
          >
            <Text style={styles.flowName}>{flow.name}</Text>
            <Text style={styles.flowDescription}>{flow.description}</Text>
            <Text style={styles.flowDuration}>
              {flow.items.length} {flow.items.length === 1 ? 'item' : 'items'} • {formatMinutesSeconds(getTimePartsMinSec(calculateFlowDurationWithTransitions(flow, durationMultiplier)))}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onCancel}
        style={styles.cancelButton}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: colorTheme.fontColor,
    marginBottom: 20,
    textAlign: "center",
  },
  multiplierContainer: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  multiplierLabel: {
    fontSize: 16,
    color: colorTheme.fontColor,
    marginBottom: 8,
  },
  multiplierInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  multiplierInput: {
    borderWidth: 1,
    borderColor: colorTheme.borderColor,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colorTheme.fontColor,
    fontSize: 18,
    width: 80,
    textAlign: "center",
  },
  multiplierX: {
    fontSize: 18,
    color: colorTheme.fontColor,
    marginLeft: 8,
  },
  multiplierResetButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colorTheme.borderColor,
    borderRadius: 6,
  },
  multiplierResetText: {
    fontSize: 14,
    color: colorTheme.fontColor,
  },
  flowList: {
    flex: 1,
  },
  flowListContent: {
    paddingBottom: 20,
  },
  flowCard: {
    padding: 20,
    borderWidth: 2,
    borderColor: colorTheme.borderColor,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  flowName: {
    fontSize: 22,
    fontWeight: "600",
    color: colorTheme.fontColor,
    marginBottom: 8,
  },
  flowDescription: {
    fontSize: 16,
    color: colorTheme.fontColor,
    opacity: 0.7,
    marginBottom: 12,
  },
  flowDuration: {
    fontSize: 14,
    color: colorTheme.borderColor,
    fontVariant: ["tabular-nums"],
  },
  cancelButton: {
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: colorTheme.minimumTrackTintColor,
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 18,
    color: colorTheme.fontColor,
    textAlign: "center",
  },
});
