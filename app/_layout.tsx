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
import { Platform, Alert } from "react-native";
import { Constants } from "@/constants/constants";
import { SettingsSvg } from "@/assets/images/svgx/settings";
import {
  DisplayAdsContext,
  DisplayAdsProvider,
} from "../components/display-ads-context";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  useEffect(() => {
    if (Platform.OS === "ios") {
      try {
        Purchases.configure({ apiKey: Constants.PURCHASES_API_KEY });
      } catch (e: any) {
        Alert.alert(e.message);
        console.error("Could not cofigure purchases", e);
      }
    }
    /* else if (Platform.OS === 'android') {
       Purchases.configure({apiKey: <revenuecat_project_google_api_key>});

      // OR: if building for Amazon, be sure to follow the installation instructions then:
       Purchases.configure({ apiKey: <revenuecat_project_amazon_api_key>, useAmazon: true });
    } */
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
    <DisplayAdsProvider>
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
    </DisplayAdsProvider>
  );
}
