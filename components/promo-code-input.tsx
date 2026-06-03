/**
 * PromoCodeInput
 *
 * Settings-page tile that lets users enter a promo code and lists any
 * currently-active promos with a Remove action.
 *
 * Activating "remove-ads" calls setDisplayAds(false). Removing it only
 * re-enables ads if the user does NOT have a purchase-based entitlement
 * keeping them off (so a paying user who tested with the promo doesn't
 * accidentally lose their ad-free state when revoking the promo).
 */

import { useContext, useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Constants } from "@/constants/constants";
import { DisplayAdsContext } from "./display-ads-context";
import { getData } from "../assets/utils/persistent-storage";
import {
  type PromoId,
  PROMO_DEFS,
  activatePromo,
  deactivatePromo,
  findPromoByCode,
  getPromoDef,
  loadActivePromos,
} from "@/assets/data/promo-codes";

type Feedback = { kind: "success" | "error"; text: string };

const PromoCodeInput = () => {
  const { setDisplayAds } = useContext(DisplayAdsContext);
  const [input, setInput] = useState("");
  const [activePromos, setActivePromos] = useState<PromoId[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);

  // Load active promos on mount.
  useEffect(() => {
    loadActivePromos().then(setActivePromos);
  }, []);

  const handleApply = async () => {
    setFeedback(null);
    const promo = findPromoByCode(input);
    if (!promo) {
      setFeedback({ kind: "error", text: "Code not recognized." });
      return;
    }
    if (activePromos.includes(promo.id)) {
      setFeedback({
        kind: "error",
        text: `${promo.name} is already active.`,
      });
      return;
    }
    setBusy(true);
    try {
      await activatePromo(promo.id);
      // Side effect per promo type.
      if (promo.id === "remove-ads") {
        setDisplayAds(false);
      }
      setActivePromos((prev) => [...prev, promo.id]);
      setInput("");
      setFeedback({ kind: "success", text: `${promo.name} activated.` });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (id: PromoId) => {
    setFeedback(null);
    setBusy(true);
    try {
      await deactivatePromo(id);
      if (id === "remove-ads") {
        // Only flip ads back on if there's no purchase entitlement still
        // keeping them off. Otherwise the paying user would suddenly see ads.
        const purchase = await getData(Constants.REMOVE_ADS_DATA_KEY);
        if (!purchase?.removeAds) {
          setDisplayAds(true);
        }
      }
      setActivePromos((prev) => prev.filter((p) => p !== id));
    } finally {
      setBusy(false);
    }
  };

  // If there are no possible promos at all (future-proofing), render nothing.
  if (PROMO_DEFS.length === 0) return null;

  const canApply = input.trim().length > 0 && !busy;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Have a Promo Code?</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Enter code"
          placeholderTextColor="#888"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
          returnKeyType="go"
          onSubmitEditing={handleApply}
        />
        <Pressable
          onPress={handleApply}
          disabled={!canApply}
          style={({ pressed }) => [
            styles.applyButton,
            !canApply && styles.applyButtonDisabled,
            pressed && canApply && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.applyButtonText}>Apply</Text>
        </Pressable>
      </View>

      {feedback && (
        <Text
          style={[
            styles.feedback,
            feedback.kind === "success"
              ? styles.feedbackSuccess
              : styles.feedbackError,
          ]}
        >
          {feedback.text}
        </Text>
      )}

      {activePromos.length > 0 && (
        <View style={styles.activeSection}>
          <Text style={styles.activeHeader}>Active</Text>
          {activePromos.map((id) => {
            const def = getPromoDef(id);
            if (!def) return null;
            return (
              <View key={id} style={styles.activeRow}>
                <View style={styles.activeText}>
                  <Text style={styles.activeName}>{def.name}</Text>
                  <Text style={styles.activeDesc}>{def.description}</Text>
                </View>
                <Pressable
                  onPress={() => handleRemove(id)}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

// Match the settings page's existing visual language (tintColorLight title bar,
// monochrome surrounds, plenty of breathing room).
const tintColorLight = "#0a7ea4";

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "stretch",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    color: tintColorLight,
    fontSize: 24,
    fontWeight: "normal",
    borderBottomWidth: 1,
    borderBottomColor: "#687076",
    paddingTop: 10,
    paddingBottom: 6,
    textAlign: "center",
  },

  // Input row
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  input: {
    flex: 1,
    backgroundColor: "#262626",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  applyButton: {
    backgroundColor: tintColorLight,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  applyButtonDisabled: {
    backgroundColor: "#444",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  // Feedback
  feedback: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
  },
  feedbackSuccess: {
    color: "#4ade80",
  },
  feedbackError: {
    color: "#f87171",
  },

  // Active promos list
  activeSection: {
    marginTop: 22,
  },
  activeHeader: {
    color: "#999",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  activeText: {
    flex: 1,
    marginRight: 12,
  },
  activeName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  activeDesc: {
    color: "#999",
    fontSize: 13,
    marginTop: 2,
  },
  removeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#666",
  },
  removeButtonText: {
    color: "#ccc",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default PromoCodeInput;
