import { StyleSheet, View } from "react-native";
import { useContext, useEffect } from "react";
import PaywallScreen from "@/components/paywall-screen";
import PromoCodeInput from "@/components/promo-code-input";
import RestorePurchasesButton from "@/components/restore-purchases-button";
import { DisplayAdsContext } from "../components/display-ads-context";
import { deactivateKeepAwake } from "expo-keep-awake";

import Support from "@/components/support";
export default function TabTwoScreen() {
  useEffect(() => {
    // deactivateKeepAwake is async on web (Wake Lock API) — use .catch() not try/catch
    deactivateKeepAwake().catch(() => {
      // Wake lock may not have been activated yet (e.g. on web or direct navigation)
    });
  }, []);
  const { displayAds } = useContext(DisplayAdsContext);

  return (
    <View style={styles.viewBody}>
      <PaywallScreen></PaywallScreen>
      <PromoCodeInput />
      <Support></Support>
      <View style={styles.container}>
        {displayAds && <RestorePurchasesButton />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  settingsInput: {
    padding: 25,
  },
  settingsText: {
    padding: 18,
    fontSize: 25,
  },
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
    justifyContent: "space-evenly",
    flex: 1,
  },
  container: {
    alignItems: "center",
    // padding: 8,
    // flex: 1,
  },
});
