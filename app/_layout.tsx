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
import { setStatusBarBackgroundColor } from "expo-status-bar";
// import mobileAds from "react-native-google-mobile-ads";

import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";

const local = true;
// if (!local) {
//   mobileAds()
//     .initialize()
//     .then((adapterStatuses) => {
//       // Initialization complete!
//     });
// }
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default async function RootLayout() {
  if (!local) {
    const result = await check(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
    if (result === RESULTS.DENIED) {
      // The permission has not been requested, so request it.
      await request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
    }

    // const adapterStatuses = await mobileAds().initialize();
  }
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
        headerStyle: {
          backgroundColor: "#dfffea",
        },
        headerRight: () => <SettingsSvg />,
      }}
    >
      {/* <Stack.Screen name="+html" options={{ headerShown: false }} /> */}
      <Stack.Screen name="+not-found" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
