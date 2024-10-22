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
import Purchases from "react-native-purchases";
import PaywallScreen from "@/components/paywall";
import Config from "react-native-config";
import { SafeAreaView } from "react-native-safe-area-context";
const checkPurchases = async () => {
  try {
    // access latest customerInfo
    const customerInfo = await Purchases.getCustomerInfo();

    if (
      typeof customerInfo.entitlements.active[Config.ENTITLEMENT_ID || ""] !==
      "undefined"
    ) {
      // do not show adds
    } else {
      // navigation.navigate("Paywall");
    }
  } catch (e: any) {
    Alert.alert("Error fetching customer info", e.message);
  }
};

export default function TabTwoScreen() {
  const [noAdsCode, setNoAdsCode] = useState<string>("");
  useState(async () => {
    await checkPurchases();
  });
  return (
    <SafeAreaView style={styles.viewBody}>
      <PaywallScreen></PaywallScreen>
      <ScrollView>
        <View style={styles.viewBody}>
          <Text style={styles.settingsText}>Purchase and Remove Ads</Text>
          <Text style={styles.settingsText}>How to use pranayama video</Text>
          <Text style={styles.settingsText}>How to use yoga video</Text>
          <Text style={styles.settingsText}>How to use HITT video</Text>
          <Text>suggestions / comments? email: app.support@fastmail.fm</Text>
        </View>
      </ScrollView>
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
});
