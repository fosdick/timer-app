import { useAppStyles } from "@/components/user-preferences-context";
import { ThemedView } from "@/components/ThemedView";
import BreathScreen from "@/components/breath/BreathScreen";
import { useKeepAwake } from "expo-keep-awake";
import { BannerAdsView } from "@/components/banner-ads-view";


export default function TabTwoScreen() {
  const { screen: screenStyles } = useAppStyles();
  useKeepAwake();
  return (
    <ThemedView style={screenStyles.viewBody}>
      <BreathScreen />

      <BannerAdsView></BannerAdsView>
    </ThemedView>
  );
}
