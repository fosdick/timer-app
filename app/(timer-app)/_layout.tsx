import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, View, Alert, Text } from "react-native";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
// import { useKeepAwake } from "expo-keep-awake";
import { YogaSvg } from "@/assets/images/svgx/yoga";
import { PranayamaSvg } from "@/assets/images/svgx/pranayama";
import { HittSvg } from "@/assets/images/svgx/hitt";
import { Constants } from "@/constants/constants";
import { getData, storeData } from "../../assets/utils/persistant-storage";
import Purchases from "react-native-purchases";
import { GreenTheme } from "@/assets/styles/timer-app";
// import mobileAds from "react-native-google-mobile-ads";
import {
  BannerAdSize,
  BannerAd,
  TestIds,
} from "react-native-google-mobile-ads";

export default function TabLayout() {
  const [removeAds, setRemoveAds] = useState(false);

  const checkPurchases = async () => {
    try {
      // access latest customerInfo
      const customerInfo = await Purchases.getCustomerInfo();
      if (
        typeof customerInfo.entitlements.active[Constants.ENTITLEMENT_ID] !==
        "undefined"
      ) {
        // do not show adds
        setRemoveAds(true);
      }
    } catch (e: any) {
      console.error("Error fetching customer info", e.message);
    } finally {
      // check local storage
      // maybe off line
      const removeAdsData = await getData(Constants.REMOVE_ADS_DATA_KEY);
      if (removeAdsData?.removeAds) {
        setRemoveAds(true);
      }
    }
  };
  useState(async () => {
    await checkPurchases();
  });

  const colorScheme = useColorScheme();
  // useKeepAwake();

  const adUnitId = TestIds.BANNER; //__DEV__ ? TestIds.BANNER : Constants.ADMOD_ADUNIT_ID;

  return (
    <View style={styles.tabsWithAds}>
      {!removeAds && (
        <View style={styles.adView}>
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
        </View>
      )}
      <Tabs
        sceneContainerStyle={{
          backgroundColor: "#080B0c",
        }}
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "dark"].tint,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#080B0c",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Pranayama",
            tabBarIcon: ({ color, focused }) => <PranayamaSvg color={color} />,
          }}
        />
        <Tabs.Screen
          name="yoga"
          options={{
            title: "Yoga",
            tabBarIcon: ({ color, focused }) => <YogaSvg color={color} />,
          }}
        />
        <Tabs.Screen
          name="hitt"
          options={{
            title: "HITT",
            tabBarIcon: ({ color, focused }) => <HittSvg color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
const styles = StyleSheet.create({
  tabsWithAds: {
    // marginTop: 30,
    flex: 1,
  },
  adView: {
    // flex: 1,
    // justifyContent: "flex-end",
  },
});
