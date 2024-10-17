import Ionicons from "@expo/vector-icons/Ionicons";
import {
  StyleSheet,
  Image,
  Platform,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Button,
} from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { useEffect, useState } from "react";
import { Settings } from "@/assets/styles/timer-app";
import Purchases from "react-native-purchases";
import Config from "react-native-config";
console.log(Config, "catsssssss");
if (Platform.OS === "ios") {
  Purchases.configure({ apiKey: Config.PURCHASES_API_KEY || "" });
}
{
  /* else if (Platform.OS === 'android') {
       Purchases.configure({apiKey: <revenuecat_project_google_api_key>});

      // OR: if building for Amazon, be sure to follow the installation instructions then:
       Purchases.configure({ apiKey: <revenuecat_project_amazon_api_key>, useAmazon: true });
    } */
}
export default function TabTwoScreen() {
  const [noAdsCode, setNoAdsCode] = useState<string>("");

  const handleNoAds = (codeText: string) => {
    setNoAdsCode(codeText);
  };
  let products: any = {};
  useState(async () => {
    try {
      products = await Purchases.getProducts;
      if (console.log(products, "pro ducks")) {
        // Display packages for sale
      }
    } catch (e) {
      console.log(e, "error with purchases get offer");
    }
  });

  return (
    <View style={styles.viewBody}>
      <View>
        <Text>{products?.current?.availablePackages} </Text>
      </View>
      {/* <Text style={styles.settingsText}>
        Enter Code to Remove Ads - Beta Only!
      </Text>
      <TextInput
        style={styles.settingsInput}
        onChangeText={handleNoAds}
        value={noAdsCode}
        placeholder="Enter Code"
      /> */}
      <View style={styles.viewBody}>
        <Text style={styles.settingsText}>Purchase and Remove Ads</Text>
        <Text style={styles.settingsText}>How to use pranayama video</Text>
        <Text style={styles.settingsText}>How to use yoga video</Text>
        <Text style={styles.settingsText}>How to use HITT video</Text>
        <Text>suggestions / comments? email: app.support@fastmail.fm</Text>
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
  },
});
