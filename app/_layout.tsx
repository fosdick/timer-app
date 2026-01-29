import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import Purchases from "react-native-purchases";
import { Platform, Alert } from "react-native";

// app files
import { Constants } from "@/constants/constants";
import { SettingsSvg } from "@/assets/images/svgx/settings";
import { colorTheme } from "@/assets/styles/timer-app";
import { DisplayAdsProvider } from "../components/display-ads-context";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  useEffect(() => {
    if (Platform.OS === "ios") {
      try {
        Purchases.configure({ apiKey: Constants.PURCHASES_API_KEY });
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error ? e.message : "An error occurred";
        Alert.alert(errorMessage);
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
            backgroundColor: colorTheme.headerLiteShade,
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
