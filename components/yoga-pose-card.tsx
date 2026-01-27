import { Text, View, StyleSheet } from "react-native";
import { YogaPose } from "@/assets/data/yoga-flows";
import { TimerStyles, colorTheme } from "@/assets/styles/timer-app";
import { formatMinutesSeconds, getTimePartsMinSec } from "@/assets/utils/format-time";

interface YogaPoseCardProps {
  pose: YogaPose | null;
  type: "previous" | "current" | "next";
  timeRemaining?: number;
}

export default function YogaPoseCard({ pose, type, timeRemaining }: YogaPoseCardProps) {
  if (!pose) {
    return null;
  }

  const getCardStyle = () => {
    switch (type) {
      case "current":
        return styles.currentCard;
      case "previous":
        return styles.previousCard;
      case "next":
        return styles.nextCard;
      default:
        return {};
    }
  };

  const getTextStyle = () => {
    switch (type) {
      case "current":
        return styles.currentText;
      case "previous":
        return styles.previousText;
      case "next":
        return styles.nextText;
      default:
        return {};
    }
  };

  const getLabelStyle = () => {
    switch (type) {
      case "current":
        return styles.currentLabel;
      case "previous":
        return styles.previousLabel;
      case "next":
        return styles.nextLabel;
      default:
        return {};
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "current":
        return "CURRENT POSE";
      case "previous":
        return "PREVIOUS";
      case "next":
        return "NEXT";
      default:
        return "";
    }
  };

  const displayTime = timeRemaining !== undefined
    ? formatMinutesSeconds(getTimePartsMinSec(timeRemaining))
    : formatMinutesSeconds(getTimePartsMinSec(pose.duration));

  return (
    <View style={[styles.card, getCardStyle()]}>
      <Text style={[styles.label, getLabelStyle()]}>{getTypeLabel()}</Text>
      <Text style={[styles.poseName, getTextStyle()]}>{pose.name}</Text>
      {type === "current" && (
        <Text style={[TimerStyles.timerFace, { marginTop: 10 }]}>
          {displayTime}
        </Text>
      )}
      {type !== "current" && (
        <Text style={[styles.duration, getTextStyle()]}>
          {displayTime}
        </Text>
      )}
      {pose.description && type === "current" && (
        <Text style={[styles.description, getTextStyle()]}>
          {pose.description}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginVertical: 8,
    width: "90%",
    alignSelf: "center",
  },
  previousCard: {
    borderColor: colorTheme.maximumTrackTintColor,
    opacity: 0.5,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  currentCard: {
    borderColor: colorTheme.borderColor,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  nextCard: {
    borderColor: colorTheme.minimumTrackTintColor,
    opacity: 0.7,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 4,
  },
  previousLabel: {
    color: colorTheme.maximumTrackTintColor,
  },
  currentLabel: {
    color: colorTheme.borderColor,
  },
  nextLabel: {
    color: colorTheme.minimumTrackTintColor,
  },
  poseName: {
    fontSize: 18,
    fontWeight: "500",
  },
  previousText: {
    color: colorTheme.fontColor,
    opacity: 0.6,
  },
  currentText: {
    color: colorTheme.fontColor,
  },
  nextText: {
    color: colorTheme.fontColor,
    opacity: 0.7,
  },
  duration: {
    fontSize: 14,
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: "italic",
    opacity: 0.8,
  },
});
