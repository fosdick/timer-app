import { Text, TouchableOpacity, View, StyleSheet, ScrollView } from "react-native";
import { YOGA_FLOWS, YogaFlow } from "@/assets/data/yoga-flows";
import { colorTheme } from "@/assets/styles/timer-app";
import { formatMinutesSeconds, getTimePartsMinSec } from "@/assets/utils/format-time";

interface YogaFlowSelectProps {
  onSelectFlow: (flow: YogaFlow) => void;
  onSelectManual: () => void;
  onCancel: () => void;
}

export default function YogaFlowSelect({ onSelectFlow, onSelectManual, onCancel }: YogaFlowSelectProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Flow</Text>

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
            onPress={() => onSelectFlow(flow)}
            style={styles.flowCard}
          >
            <Text style={styles.flowName}>{flow.name}</Text>
            <Text style={styles.flowDescription}>{flow.description}</Text>
            <Text style={styles.flowDuration}>
              {flow.items.length} {flow.items.length === 1 ? 'item' : 'items'} • {formatMinutesSeconds(getTimePartsMinSec(flow.totalDuration))}
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
    marginBottom: 30,
    textAlign: "center",
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
