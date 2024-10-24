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
import { Constants } from "@/./constants";
import { getData, storeData } from "../../assets/utils/persistant-storage";

// import mobileAds from "react-native-google-mobile-ads";
import {
  BannerAdSize,
  BannerAd,
  TestIds,
} from "react-native-google-mobile-ads";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  useKeepAwake();

  const [removeAds, setRemoveAds] = useState(true);

  useState(async () => {
    const savedData = await getData(Constants.USER_SETTINGS_DATA);
    if (savedData?.removeAds) {
      setRemoveAds(savedData.removeAds);
    }
  });
  const adUnitId = __DEV__ ? TestIds.BANNER : Constants.ADMOD_ADUNIT_ID || "";

  return (
    <View style={styles.tabsWithAds}>
      {removeAds && (
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
