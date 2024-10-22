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
import Purchases from "react-native-purchases";
import { Platform } from "react-native";
import Config from "react-native-config";
import { SettingsSvg } from "@/assets/images/svgx/settings";
// import mobileAds from "react-native-google-mobile-ads";

// mobileAds()
//   .initialize()
//   .then((adapterStatuses) => {
//     // Initialization complete!
//   });

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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

  return (
    <Stack
      screenOptions={{
        title: "Timer App Yoga",
        headerStyle: {
          // backgroundColor: "#080B0c",
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
