import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useKeepAwake } from "expo-keep-awake";
import { YogaSvg } from "@/assets/images/svgx/yoga";
import { Pranayama } from "@/assets/images/svgx/pranayama";
import { HittSvg } from "@/assets/images/svgx/hitt";
import Config from "react-native-config";
import { getData, storeData } from "../../assets/utils/persistant-storage";
import Purchases from "react-native-purchases";
import { Platform } from "react-native";
// import mobileAds from "react-native-google-mobile-ads";
import {
  BannerAdSize,
  BannerAd,
  TestIds,
} from "react-native-google-mobile-ads";

if (Platform.OS === "ios") {
  Purchases.configure({ apiKey: Config.PURCHASES_API_KEY || "" });
}
{
  /* else if (Platform.OS === 'android') {
       Purchases.configure({apiKey: <revenuecat_project_google_api_key>});

      // OR: if building for Amazon, be sure to follow the installation instructions then:
       Purchases.configure({ apiKey: <revenuecat_project_amazon_api_key>, useAmazon: true });
    } */
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  useKeepAwake();

  const [removeAds, setRemoveAds] = useState(true);

  useState(async () => {
    const savedData = await getData(Config.USER_SETTINGS_DATA);
    if (savedData?.removeAds) {
      setRemoveAds(savedData.removeAds);
    }
  });
  return (
    <View style={styles.tabsWithAds}>
      {removeAds && (
        <View style={styles.adView}>
          <BannerAd
            size={BannerAdSize.FULL_BANNER}
            unitId={TestIds.BANNER}
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
            tabBarIcon: ({ color, focused }) => <Pranayama color={color} />,
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
