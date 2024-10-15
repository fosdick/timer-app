import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useKeepAwake } from "expo-keep-awake";
import { YogaSvg } from "@/assets/images/svgx/yoga";
import { Pranayama } from "@/assets/images/svgx/pranayama";
import { HittSvg } from "@/assets/images/svgx/hitt";

import {
  BannerAdSize,
  BannerAd,
  TestIds,
} from "react-native-google-mobile-ads";

import mobileAds from "react-native-google-mobile-ads";

export default async function TabLayout() {
  const colorScheme = useColorScheme();
  useKeepAwake();
  // const ads = await mobileAds();
  // await ads.initialize();

  return (
    <View>
      <View>
        <BannerAd
          size={BannerAdSize.BANNER}
          unitId={TestIds.INTERSTITIAL}
          onAdLoaded={() => {
            console.log("Advert loaded");
          }}
          onAdFailedToLoad={(error) => {
            console.error("Advert failed to load: ", error);
          }}
        />
      </View>

      <Tabs
        sceneContainerStyle={{
          backgroundColor: "#080B0c",
        }}
        screenOptions={{
          // tabBarActiveTintColor: Colors[colorScheme ?? "dark"].tint,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#dfffea",
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
