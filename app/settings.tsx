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

export default function TabTwoScreen() {
  const [noAdsCode, setNoAdsCode] = useState<string>("");

  const handleNoAds = (codeText: string) => {
    setNoAdsCode(codeText);
  };
  return (
    <View style={styles.viewBody}>
      <Text style={styles.settingsText}>
        Enter Code to Remove Ads - Beta Only!
      </Text>
      <TextInput
        style={styles.settingsInput}
        style={Settings.regText}
        onChangeText={handleNoAds}
        value={noAdsCode}
        placeholder="Enter Code"
      />
      <View style={styles.viewBody}>
        <Text style={styles.settingsText}>Purchase and Remove Ads</Text>
        <Text style={styles.settingsText}>How to use pranayama video</Text>
        <Text style={styles.settingsText}>How to use yoga video</Text>
        <Text style={styles.settingsText}>How to use HITT video</Text>
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
