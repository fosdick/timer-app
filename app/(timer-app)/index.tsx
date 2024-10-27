import Ionicons from "@expo/vector-icons/Ionicons";
import {
  StyleSheet,
  Image,
  Platform,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Pranayama from "@/components/pranayama";
import { useKeepAwake } from "expo-keep-awake";
import { BannerAdsView } from "@/components/banner-ads-view";
import { screenStyles } from "@/assets/styles/timer-app";

export default function TabTwoScreen() {
  useKeepAwake();
  return (
    <ThemedView style={screenStyles.viewBody}>
      <View>
        <Pranayama></Pranayama>
      </View>

      <BannerAdsView></BannerAdsView>
    </ThemedView>
  );
}
