import { Tabs } from "expo-router";
import React, { useContext } from "react";
import { Alert, StyleSheet, View } from "react-native";
// import { useKeepAwake } from "expo-keep-awake";
import { YogaSvg } from "@/assets/images/svgx/yoga";
import { PranayamaSvg } from "@/assets/images/svgx/pranayama";
import { LotusSvg } from "@/assets/images/svgx/lotus";
import { useAppColors } from "@/components/user-preferences-context";
import { ActiveTimerContext } from "@/components/active-timer-context";
import { guardTabPress } from "@/assets/utils/tab-switch-guard";

export default function TabLayout() {
  // useKeepAwake();
  const { isAnyTimerRunning } = useContext(ActiveTimerContext);
  const c = useAppColors();

  return (
    <View style={styles.tabsWithAds}>
      {/* <BannerAdsView></BannerAdsView> */}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: c.tabBarActiveTintColor,
          // tabBarInactiveTintColor: c.tabBarInActiveTintColor,
          headerShown: false,
          // sceneStyle replaces the old top-level sceneContainerStyle prop
          sceneStyle: {
            backgroundColor: c.backgroundColor,
          },
          tabBarStyle: {
            backgroundColor: c.backgroundColor,
            borderBlockColor: c.borderColor,
          },
        }}
        screenListeners={({ navigation, route }) => ({
          // While a timer is running, an accidental tab tap (phone set down)
          // must not silently stop the practice. Block the default switch and
          // confirm first; a clean state switches instantly as before.
          tabPress: (e) => {
            // Pressing the already-focused tab isn't a switch — never prompt.
            if (navigation.isFocused()) return;
            guardTabPress({
              isAnyTimerRunning,
              preventDefault: () => e.preventDefault(),
              confirmSwitch: () =>
                Alert.alert(
                  "Timer running",
                  "Switching tabs will stop your current timer. Switch anyway?",
                  [
                    { text: "Stay", style: "cancel" },
                    {
                      text: "Switch",
                      style: "destructive",
                      onPress: () => navigation.navigate(route.name),
                    },
                  ],
                ),
            });
          },
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Pranayama",
            // testID so E2E (Maestro) can tap the tab — its text label isn't
            // exposed as a matchable element on iOS.
            tabBarButtonTestID: "tab-pranayama",
            tabBarIcon: ({ color }) => <PranayamaSvg color={color} />,
          }}
        />
        <Tabs.Screen
          name="yoga"
          options={{
            title: "Yoga",
            tabBarButtonTestID: "tab-yoga",
            tabBarIcon: ({ color, focused }) => <YogaSvg color={color} />,
          }}
        />
        <Tabs.Screen
          name="meditation"
          options={{
            title: "Meditation",
            tabBarButtonTestID: "tab-meditation",
            tabBarIcon: ({ color }) => <LotusSvg color={color} />,
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
