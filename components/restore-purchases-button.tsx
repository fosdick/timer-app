import React, { useContext, useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import Purchases from "react-native-purchases";
import { Constants } from "@/constants/constants";
import { storeData } from "../assets/utils/persistent-storage";
import { DisplayAdsContext } from "../components/display-ads-context";
import { colorTheme } from "@/assets/styles/timer-app";

type Status = "idle" | "working" | "none-found" | "error";

const RestorePurchasesButton = () => {
  const { displayAds, setDisplayAds } = useContext(DisplayAdsContext);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Apple requires a restore path for a non-consumable, and reviewers exercise
  // it. It used to discard restorePurchases()'s return value entirely, so a
  // successful restore changed NOTHING on screen — ads stayed up until the next
  // cold launch, which reads as "the button is broken". Now the returned
  // customerInfo decides, and the outcome is always reported.
  const restorePurchases = async () => {
    setStatus("working");
    setErrorMsg("");
    try {
      const customerInfo = await Purchases.restorePurchases();
      const entitled =
        typeof customerInfo.entitlements.active[
          Constants.ENTITLEMENT_IDENTIFIER
        ] !== "undefined";
      if (entitled) {
        setDisplayAds(false);
        await storeData(Constants.REMOVE_ADS_DATA_KEY, { removeAds: true });
        setStatus("idle"); // ads disappearing IS the confirmation
      } else {
        // Restore succeeded, but this Apple ID has nothing to restore. Saying so
        // is much better than silently doing nothing.
        setStatus("none-found");
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "An error occurred";
      setErrorMsg(message);
      setStatus("error");
      console.error("Error restoring purchases", message);
    }
  };

  const label =
    status === "working"
      ? "restoring"
      : status === "none-found"
        ? "No purchases found"
        : status === "error"
          ? errorMsg
          : "Restore Purchases";

  const styles = StyleSheet.create({
    button: {
      marginTop: "auto",
    },
    container: {
      alignItems: "center",
      padding: 8,
    },
    title: {
      color: status === "error" ? "red" : colorTheme.activeTimerDimmed,
      fontFamily: "ArialRoundedMTBold",
      fontSize: 18,
      paddingVertical: 16,
      fontWeight: "bold",
      borderBottomWidth: 1,
      borderBottomColor: "#687076",
      paddingTop: 100,
      alignItems: "center",
    },
  });

  return (
    <View>
      {displayAds && (
        <Pressable
          testID="restore-purchases"
          onPress={restorePurchases}
          disabled={status === "working"}
          style={styles.button}
        >
          <Text style={styles.title}>{label}</Text>
        </Pressable>
      )}
    </View>
  );
};

export default RestorePurchasesButton;
