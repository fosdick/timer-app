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
import { colorTheme } from "@/assets/styles/timer-app";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // useKeepAwake();

  return (
    <View style={styles.tabsWithAds}>
      {/* <BannerAdsView></BannerAdsView> */}
      <Tabs
        sceneContainerStyle={{
          backgroundColor: colorTheme.backgroundColor,
        }}
        screenOptions={{
          tabBarActiveTintColor: colorTheme.tabBarActiveTintColor,
          // tabBarInactiveTintColor: colorTheme.tabBarInActiveTintColor,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colorTheme.backgroundColor,
            borderBlockColor: colorTheme.borderColor,
          },
        }}
        screenListeners={{
          tabPress: () => {
            // Alert.alert("tab pressed");
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
});
