import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect } from "react";
import "react-native-reanimated";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// app files
import { Constants } from "@/constants/constants";
import { UserMenu } from "@/components/user-menu";
import { useAppColors } from "@/components/user-preferences-context";
import { DisplayAdsProvider } from "../components/display-ads-context";
import { ActiveTimerProvider } from "../components/active-timer-context";
import { UserPreferencesProvider } from "../components/user-preferences-context";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  useEffect(() => {
    if (Platform.OS === "ios") {
      try {
        if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
        Purchases.configure({ apiKey: Constants.PURCHASES_API_KEY });
      } catch (e: unknown) {
        // Log only. This runs during cold launch, so an Alert here greeted the
        // user with a raw SDK error before they ever saw the app; ads simply
        // stay on if configure fails.
        console.error("Could not configure purchases", e);
      }
    }
    /* else if (Platform.OS === 'android') {
       Purchases.configure({apiKey: <revenuecat_project_google_api_key>});

      // OR: if building for Amazon, be sure to follow the installation instructions then:
       Purchases.configure({ apiKey: <revenuecat_project_amazon_api_key>, useAmazon: true });
    } */
  }, []);
  // Hide the splash on the root view's FIRST LAYOUT, not the moment fonts
  // finish. hideAsync() used to fire in the same tick the tree first rendered,
  // so the splash could come down before anything had painted — one blank frame
  // between the splash and the app. onLayout guarantees there is something laid
  // out underneath before the splash goes away.
  const onRootLayout = useCallback(() => {
    if (loaded) {
      void SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onRootLayout}>
      {/* The header is headerLiteShade (near-white mint) and it extends under
          the status bar, so the status-bar glyphs must be DARK. Under
          userInterfaceStyle "dark" iOS would otherwise draw them white — i.e.
          invisible. */}
      <StatusBar style="dark" />
      <DisplayAdsProvider>
        <ActiveTimerProvider>
          <UserPreferencesProvider>
            <ThemedStack />
          </UserPreferencesProvider>
        </ActiveTimerProvider>
      </DisplayAdsProvider>
    </GestureHandlerRootView>
  );
}

/**
 * The navigator, split out so it sits INSIDE UserPreferencesProvider and can read
 * the accent. Calling the hook in RootLayout would silently get the default context
 * — RootLayout is the provider's parent, not its descendant — and the header would
 * never follow the theme.
 */
function ThemedStack() {
  const c = useAppColors();
  return (
      <Stack
        screenOptions={{
          title: "Timer App Yoga",
          headerStyle: {
            backgroundColor: c.headerLiteShade,
          },
          // Explicit ink for the title and the back button. Without this,
          // React Navigation tints the header by system appearance, so
          // every dark-mode user got a WHITE title on near-white mint.
          headerTintColor: c.headerInk,
          // Every Stack screen gets the app background. Without this, the
          // navigator's default (light) showed through on App Settings —
          // whose own paywall row is styled dark (#1a1a1a on white text),
          // i.e. it was always meant to sit on a dark screen. User
          // Preferences only looked right because it sets its own.
          contentStyle: { backgroundColor: c.backgroundColor },
          headerRight: () => <UserMenu />,
        }}
      >
        {/* <Stack.Screen name="+html" options={{ headerShown: false }} /> */}
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="settings" options={{ title: "App Settings" }} />
        <Stack.Screen
          name="user-preferences"
          options={{ title: "User Preferences" }}
        />
      </Stack>
  );
}
