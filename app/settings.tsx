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
import { useContext } from "react";
import PaywallScreen from "@/components/paywall-screen";
import RestorePurchasesButton from "@/components/restore-purchases-button";
import { SafeAreaView } from "react-native-safe-area-context";
import { DisplayAdsContext } from "../components/display-ads-context";
import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake";

import Support from "@/components/support";
export default function TabTwoScreen() {
  deactivateKeepAwake();
  const { displayAds } = useContext(DisplayAdsContext);

  return (
    <View style={styles.viewBody}>
      <PaywallScreen></PaywallScreen>
      <Support></Support>
      <View style={styles.container}>
        {displayAds && <RestorePurchasesButton />}
      </View>
    </View>
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
    flex: 1,
  },
  container: {
    alignItems: "center",
    // padding: 8,
    // flex: 1,
  },
});
