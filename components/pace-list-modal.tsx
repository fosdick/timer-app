/**
 * PaceListModal
 *
 * Opened from the yoga screen's center icon (when in manual mode).
 *
 *   - Tap a row → applies that pace's values to the timer settings and closes
 *   - Swipe left on a row → reveals Edit and Delete actions
 *   - "+ Create new Pace" row at the top → opens the create form with defaults
 *   - Empty state when no paces exist yet
 *
 * The modal is presentational; pace persistence (add/update/delete) is
 * handled by the parent. This component just emits the user's intent.
 */

import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { yogaColors } from "@/assets/theme";
import {
  type TimerPace,
  formatPaceSummary,
} from "@/assets/data/yoga-paces";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PaceListModalProps {
  visible: boolean;
  paces: TimerPace[];
  onClose: () => void;
  onApply: (pace: TimerPace) => void;
  onCreate: () => void;
  onEdit: (pace: TimerPace) => void;
  onDelete: (pace: TimerPace) => void;
  /**
   * Reset timer settings to the "first install" defaults and exit any
   * active pace. Renders a secondary "Restore defaults" action in the
   * list footer when paces exist.
   */
  onRestoreDefaults: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PaceListModal = ({
  visible,
  paces,
  onClose,
  onApply,
  onCreate,
  onEdit,
  onDelete,
  onRestoreDefaults,
}: PaceListModalProps) => {
  // Track the currently-open Swipeable so opening a new one closes the previous
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  const handleDelete = (pace: TimerPace) => {
    Alert.alert(
      "Delete Pace",
      `Delete "${pace.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(pace),
        },
      ],
      { cancelable: true },
    );
  };

  const renderRightActions = (pace: TimerPace) => (
    <View style={styles.swipeActions}>
      <TouchableOpacity
        style={[styles.swipeAction, styles.swipeEdit]}
        onPress={() => {
          setOpenRowId(null);
          onEdit(pace);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.swipeActionText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.swipeAction, styles.swipeDelete]}
        onPress={() => {
          setOpenRowId(null);
          handleDelete(pace);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.swipeActionText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPaceRow = ({ item }: { item: TimerPace }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item)}
      onSwipeableWillOpen={() => setOpenRowId(item.id)}
      onSwipeableClose={() =>
        setOpenRowId((prev) => (prev === item.id ? null : prev))
      }
      // Auto-close any other open row when this one opens
      friction={2}
    >
      <TouchableOpacity
        style={styles.paceRow}
        onPress={() => onApply(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.paceName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.paceSummary} numberOfLines={1}>
          {formatPaceSummary(item)}
        </Text>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSide} />
          <Text style={styles.headerTitle}>Paces</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
            style={styles.headerSide}
          >
            <Text style={styles.headerAction}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {paces.length === 0 ? (
          // ── Empty state ────────────────────────────────────────────────
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No paces yet</Text>
            <Text style={styles.emptyBody}>
              Save your timer settings as a named Pace so you can switch
              between flows in seconds.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onCreate}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                Create your first Pace
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // ── List ───────────────────────────────────────────────────────
          <FlatList
            data={paces}
            keyExtractor={(item) => item.id}
            renderItem={renderPaceRow}
            ListHeaderComponent={
              <TouchableOpacity
                style={styles.createRow}
                onPress={onCreate}
                activeOpacity={0.7}
              >
                <Text style={styles.createRowText}>+ Create new Pace</Text>
              </TouchableOpacity>
            }
            ListFooterComponent={
              <TouchableOpacity
                style={styles.restoreRow}
                onPress={onRestoreDefaults}
                activeOpacity={0.7}
              >
                <Text style={styles.restoreRowText}>Restore defaults</Text>
              </TouchableOpacity>
            }
            ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
            // Allow rows to render off-screen so swipeables work smoothly
            initialNumToRender={20}
          />
        )}
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerSide: {
    minWidth: 60,
  },
  headerTitle: {
    color: yogaColors.poseCurrentName,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  headerAction: {
    color: yogaColors.timerCountdown,
    fontSize: 16,
    textAlign: "right",
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#333",
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#262626",
    marginLeft: 20,
  },

  // Create row (top)
  createRow: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#1a1a1a",
  },
  createRowText: {
    color: yogaColors.timerCountdown,
    fontSize: 16,
    fontWeight: "600",
  },

  // Restore defaults (footer — secondary, subtler than Create)
  restoreRow: {
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: "center",
    marginTop: 8,
  },
  restoreRowText: {
    color: yogaColors.instructionalText,
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.3,
  },

  // Pace row
  paceRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#1a1a1a",
  },
  paceName: {
    color: yogaColors.poseCurrentName,
    fontSize: 17,
    fontWeight: "500",
  },
  paceSummary: {
    color: yogaColors.instructionalText,
    fontSize: 13,
    marginTop: 4,
  },

  // Swipe actions
  swipeActions: {
    flexDirection: "row",
    height: "100%",
  },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    minWidth: 70,
  },
  swipeEdit: {
    backgroundColor: "#444",
  },
  swipeDelete: {
    backgroundColor: "#c0392b",
  },
  swipeActionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: yogaColors.poseCurrentName,
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
  },
  emptyBody: {
    color: yogaColors.instructionalText,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: "#333",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 22,
  },
  primaryButtonText: {
    color: yogaColors.timerCountdown,
    fontSize: 16,
    fontWeight: "600",
  },
});
