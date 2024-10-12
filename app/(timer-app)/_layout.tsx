import { Tabs } from "expo-router";
import React from "react";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useKeepAwake } from "expo-keep-awake";
import { YogaSvg } from "@/assets/images/svgx/yoga";
import { Pranayama } from "@/assets/images/svgx/pranayama";
import { HittSvg } from "@/assets/images/svgx/hitt";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  useKeepAwake();
  return (
    <Tabs
      sceneContainerStyle={{
        backgroundColor: "#080B0c",
      }}
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "dark"].tint,
        headerShown: false,
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
  );
}
