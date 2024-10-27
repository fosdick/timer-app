import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";

import { ThemedView } from "@/components/ThemedView";
import YogaView from "@/components/yoga-view";
import { screenStyles } from "@/assets/styles/timer-app";
import { useKeepAwake } from "expo-keep-awake";
import { BannerAdsView } from "@/components/banner-ads-view";

export default function TabTwoScreen() {
  useKeepAwake();
  return (
    <ThemedView style={screenStyles.viewBody}>
      <View>
        <YogaView></YogaView>
      </View>
      <BannerAdsView></BannerAdsView>
    </ThemedView>
  );
}
