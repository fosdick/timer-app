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
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useEffect, useState } from "react";
import { Settings } from "@/assets/styles/timer-app";

export default function TabTwoScreen() {
  const [noAdsCode, setNoAdsCode] = useState<string>("");

  const handleNoAds = (codeText: string) => {
    setNoAdsCode(codeText);
  };
  return (
    <ThemedView style={styles.viewBody}>
      <Text>Enter Code to Remove Ads - Beta Only!</Text>
      <TextInput
        style={Settings.regText}
        onChangeText={handleNoAds}
        value={noAdsCode}
        placeholder="Enter Code"
      />
      <TouchableOpacity>
        <Text>Purchase and Remove Ads</Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
  },
});
