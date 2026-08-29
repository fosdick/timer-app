import { useMemo } from "react";
import React, { useContext } from "react";
import { View, Text, Button, Linking, StyleSheet } from "react-native";
import { Constants } from "@/constants/constants";
import { useAppColors } from "@/components/user-preferences-context";
import type { AppColorTheme } from "@/assets/styles/timer-app";
import { DisplayAdsContext } from "./display-ads-context";
const Support = () => {
  const colorTheme = useAppColors();
  const styles = useMemo(() => makeStyles(colorTheme), [colorTheme]);
  const { customerInfoData } = useContext(DisplayAdsContext);
  const customerBody = customerInfoData
    ? `


Customer Info (support use only):

App User Id: ${customerInfoData?.originalAppUserId}

`
    : "";

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Demo Videos</Text>
      </View>
      <Button
        color={colorTheme.activeTimerDimmed}
        onPress={() => Linking.openURL(`https://youtu.be/1_mFRf8dPUE`)}
        title={`Overview`}
      />
      <Button
        color={colorTheme.activeTimerDimmed}
        onPress={() => Linking.openURL(`https://youtu.be/u9nDcjeLAvo`)}
        title={`Pranayama`}
      />
      <Button
        color={colorTheme.activeTimerDimmed}
        onPress={() => Linking.openURL(`https://youtu.be/FoFX4qkEzig`)}
        title={`Yoga`}
      />
      {/* Spacer. This used to be <Text style={styles.title}> </Text> — but
          styles.title carries borderBottomWidth:1, so a single space rendered a
          one-space-wide underline: the stray dash between the two sections. */}
      <View style={styles.sectionSpacer} />

      <View>
        <Text style={styles.title}>App Support</Text>
      </View>

      <Button
        color={colorTheme.activeTimerDimmed}
        onPress={() =>
          Linking.openURL(
            `mailto:${Constants.SUPPORT_EMAIL}?subject=Timer App Yoga&body=${customerBody}`
          )
        }
        title={`${Constants.SUPPORT_EMAIL}`}
      />

      <View>
        <Button
          color={colorTheme.activeTimerDimmed}
          onPress={() =>
            Linking.openURL("http://timer-app-yoga.jarvis1.fastmail.fm.user.fm")
          }
          title="Privacy Policy"
        />
      </View>
    </View>
  );
};

// Settings screens now sit on the app background (#080B0c), so they use the
// app's GreenTheme instead of the old #0a7ea4 teal that only read as "default"
// on the light background this page used to have.

const makeStyles = (colorTheme: AppColorTheme) =>
  StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 0,
  },
  sectionSpacer: { height: 30 },
  title: {
    color: colorTheme.activeTimerPrimary,
    fontSize: 24,
    fontWeight: "normal",
    borderBottomWidth: 1,
    borderBottomColor: "#687076",
    paddingTop: 30,
    alignItems: "center",
  },
  terms: {
    color: "darkgrey",
  },
});

export default Support;
