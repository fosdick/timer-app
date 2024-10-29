import Ionicons from "@expo/vector-icons/Ionicons";
import {
  StyleSheet,
  Image,
  Platform,
  View,
  Text,
  TouchableOpacity,
} from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import HittView from "@/components/hitt-view";
import { useKeepAwake } from "expo-keep-awake";
import { BannerAdsView } from "@/components/banner-ads-view";
import { screenStyles } from "@/assets/styles/timer-app";

import { useState } from "react";

export default function TabTwoScreen() {
  const [yogaInterval, setYogaInterval] = useState("00:oo");
  useKeepAwake();
  return (
    <ThemedView style={{ flex: 1 }}>
      <HittView></HittView>

      <BannerAdsView></BannerAdsView>
    </ThemedView>
  );
}
