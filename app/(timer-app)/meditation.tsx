import { useAppStyles } from "@/components/user-preferences-context";
import { ThemedView } from "@/components/ThemedView";
import MeditationScreen from "@/components/meditation/MeditationScreen";
import { useKeepAwake } from "expo-keep-awake";
import { BannerAdsView } from "@/components/banner-ads-view";

export default function MeditationTabScreen() {
  const { screen: screenStyles } = useAppStyles();
  useKeepAwake();
  return (
    <ThemedView style={screenStyles.viewBody}>
      <MeditationScreen />
      <BannerAdsView></BannerAdsView>
    </ThemedView>
  );
}
