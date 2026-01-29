import { ThemedView } from "@/components/ThemedView";
import Pranayama from "@/components/pranayama";
import { useKeepAwake } from "expo-keep-awake";
import { BannerAdsView } from "@/components/banner-ads-view";
import { screenStyles } from "@/assets/styles/timer-app";

export default function TabTwoScreen() {
  useKeepAwake();
  return (
    <ThemedView style={screenStyles.viewBody}>
      <Pranayama></Pranayama>

      <BannerAdsView></BannerAdsView>
    </ThemedView>
  );
}
