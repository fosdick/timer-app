import Ionicons from "@expo/vector-icons/Ionicons";
import {
  StyleSheet,
  Image,
  Platform,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  Button,
  Alert,
} from "react-native";
import { getData, storeData } from "../assets/utils/persistant-storage";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { useEffect, useState } from "react";
import { Settings } from "@/assets/styles/timer-app";

import PaywallScreen from "@/components/paywall-screen";
import RestorePurchasesButton from "@/components/restore-purchases-button";
import { SafeAreaView } from "react-native-safe-area-context";
import { Constants } from "@/constants/constants";

import Support from "@/components/support";
export default function TabTwoScreen() {
  return (
    <SafeAreaView style={styles.viewBody}>
      <PaywallScreen></PaywallScreen>
      <Support></Support>
      <View style={styles.container}>
        <RestorePurchasesButton />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  settingsInput: {
    padding: 25,
  },
  settingsText: {
    padding: 18,
    fontSize: 25,
  },
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  viewBody: {
    marginTop: 30,
    // backgroundColor: 'none'
    justifyContent: "space-evenly",
  },
  container: {
    alignItems: "center",
    padding: 8,
  },
});
