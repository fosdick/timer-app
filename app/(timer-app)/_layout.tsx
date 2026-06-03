import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
// import { useKeepAwake } from "expo-keep-awake";
import { YogaSvg } from "@/assets/images/svgx/yoga";
import { PranayamaSvg } from "@/assets/images/svgx/pranayama";
import { HittSvg } from "@/assets/images/svgx/hitt";
import { colorTheme } from "@/assets/styles/timer-app";

export default function TabLayout() {
  // useKeepAwake();

  return (
    <View style={styles.tabsWithAds}>
      {/* <BannerAdsView></BannerAdsView> */}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colorTheme.tabBarActiveTintColor,
          // tabBarInactiveTintColor: colorTheme.tabBarInActiveTintColor,
          headerShown: false,
          // sceneStyle replaces the old top-level sceneContainerStyle prop
          sceneStyle: {
            backgroundColor: colorTheme.backgroundColor,
          },
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
            tabBarIcon: ({ color }) => <PranayamaSvg color={color} />,
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
            title: "HIIT",
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
