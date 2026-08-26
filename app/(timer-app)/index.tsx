import { ThemedView } from "@/components/ThemedView";
import BreathScreen from "@/components/breath/BreathScreen";
import { useKeepAwake } from "expo-keep-awake";
import { BannerAdsView } from "@/components/banner-ads-view";
import { screenStyles } from "@/assets/styles/timer-app";

export default function TabTwoScreen() {
  useKeepAwake();
  return (
    <ThemedView style={screenStyles.viewBody}>
      <BreathScreen />

      <BannerAdsView></BannerAdsView>
    </ThemedView>
  );
}
