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
  AppOpenAd,
  InterstitialAd,
  RewardedAd,
  BannerAd,
  TestIds,
} from "react-native-google-mobile-ads";

// // # App Open
// AppOpenAd.createForAdRequest(TestIds.APP_OPEN);

// // # Interstitial
// InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL);

// // # Rewarded
// RewardedAd.createForAdRequest(TestIds.REWARDED);

// # Banners

export default function TabLayout() {
  const colorScheme = useColorScheme();
  useKeepAwake();
  return (
    <View>
      <View>
        <BannerAd unitId={TestIds.BANNER} size="100%" />
      </View>

      <Tabs
        sceneContainerStyle={{
          backgroundColor: "#080B0c",
        }}
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "dark"].tint,
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
