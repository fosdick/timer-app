// NavBar.js
import React, { useContext, useEffect } from "react";
import { DisplayAdsContext, DisplayAdsProvider } from "./display-ads-context";
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  Alert,
  SafeAreaView,
} from "react-native";
import { Constants } from "@/constants/constants";
import {
  BannerAdSize,
  BannerAd,
  TestIds,
} from "react-native-google-mobile-ads";

export const BannerAdsView = () => {
  const { displayAds } = useContext(DisplayAdsContext);
  const adUnitId = __DEV__ ? TestIds.BANNER : Constants.ADMOD_ADUNIT_ID;

  return (
    <SafeAreaView style={styles.BannerAdBottom}>
      <BannerAd
        size={BannerAdSize.FULL_BANNER}
        unitId={adUnitId}
        onAdLoaded={() => {
          // console.log("Advert loaded");
        }}
        onAdFailedToLoad={(error) => {
          console.error("Advert failed to load: ", error);
        }}
      />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  BannerAdBottom: {
    position: "absolute",
    margin: 0,
    padding: 0,
    left: 0,
    // backgroundColor: "#ff00ff",
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
