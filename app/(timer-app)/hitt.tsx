import { ThemedView } from "@/components/ThemedView";
import HittView from "@/components/hitt-view";
import { useKeepAwake } from "expo-keep-awake";
import { BannerAdsView } from "@/components/banner-ads-view";

export default function TabTwoScreen() {
  useKeepAwake();
  return (
    <ThemedView style={{ flex: 1 }}>
      <HittView></HittView>

      <BannerAdsView></BannerAdsView>
    </ThemedView>
  );
}
