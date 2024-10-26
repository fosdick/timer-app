// NavBar.js
import React, { useContext, useEffect } from "react";
import { DisplayAdsContext, DisplayAdsProvider } from "./display-ads-context";
import { Text, View, Pressable, StyleSheet, Alert } from "react-native";
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
    <View>
      {displayAds && (
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
      )}
    </View>
  );
};
