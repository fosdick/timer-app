import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, Navigator } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Component, useEffect } from "react";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";

import { SettingsSvg } from "@/assets/images/svgx/settings";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }
  const pressed = () => {
    return "prseed";
  };
  return (
    <Stack
      screenOptions={{
        title: "Timer App",
        headerRight: () => <SettingsSvg />,
      }}
    >
      {/* <Stack.Screen name="+html" options={{ headerShown: false }} /> */}
      <Stack.Screen name="+not-found" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
