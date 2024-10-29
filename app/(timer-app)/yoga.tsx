import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";

import { ThemedView } from "@/components/ThemedView";
import YogaView from "@/components/yoga-view";
import { screenStyles, TimerStyles } from "@/assets/styles/timer-app";
import { useKeepAwake } from "expo-keep-awake";
import { BannerAdsView } from "@/components/banner-ads-view";

export default function TabTwoScreen() {
  useKeepAwake();
  return (
    <ThemedView style={screenStyles.viewBody}>
      <YogaView style={{ Flex: 5 }}></YogaView>

      <BannerAdsView></BannerAdsView>
    </ThemedView>
  );
}
