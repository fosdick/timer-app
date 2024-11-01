import React, { useContext } from "react";
import { Pressable, Text, View } from "react-native";
import Purchases from "react-native-purchases";
import { StyleSheet } from "react-native";
import { useState } from "react";
import EventEmitter from "eventemitter3";
import { Constants } from "@/constants/constants";
import { DisplayAdsContext } from "../components/display-ads-context";

const RestorePurchasesButton = () => {
  const { displayAds } = useContext(DisplayAdsContext);
  const eventController = new EventEmitter();
  const [errorMsg, setErrorMsg] = useState<string>("");
  const restorePurchases = async () => {
    try {
      setErrorMsg("restoring");
      const r = await Purchases.restorePurchases();
      setErrorMsg("");
    } catch (e: any) {
      eventController.emit(Constants.REMOVE_ADS_EVENT);
      setErrorMsg(e.message);
      console.error("Error restoring purchases", e.message);
    }
  };
  const tintColorLight = "#0a7ea4";
  const styles = StyleSheet.create({
    button: {
      marginTop: "auto",
    },
    container: {
      alignItems: "center",
      padding: 8,
    },
    title: {
      color: errorMsg ? "red" : "dodgerblue",
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
        <Pressable onPress={restorePurchases} style={styles.button}>
          <Text style={styles.title}>{errorMsg || "Restore Purchases"}</Text>
        </Pressable>
      )}
    </View>
  );
};

export default RestorePurchasesButton;
