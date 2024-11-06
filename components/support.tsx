import React, { useContext } from "react";
import { View, Text, Button, Linking } from "react-native";
import { GreenTheme } from "@/assets/styles/timer-app";
import { Constants } from "@/constants/constants";
import { DisplayAdsContext } from "./display-ads-context";
const Support = () => {
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
        onPress={() => Linking.openURL(`https://youtu.be/1_mFRf8dPUE`)}
        title={`Overview`}
      />
      <Button
        onPress={() => Linking.openURL(`https://youtu.be/u9nDcjeLAvo`)}
        title={`Pranayama`}
      />
      <Button
        onPress={() => Linking.openURL(`https://youtu.be/FoFX4qkEzig`)}
        title={`Yoga`}
      />
      <View>
        <Text style={styles.title}> </Text>
      </View>

      <View>
        <Text style={styles.title}>App Support</Text>
      </View>

      <Button
        onPress={() =>
          Linking.openURL(
            `mailto:${Constants.SUPPORT_EMAIL}?subject=Timer App Yoga&body=${customerBody}`
          )
        }
        title={`${Constants.SUPPORT_EMAIL}`}
      />

      <View>
        <Button
          onPress={() =>
            Linking.openURL("http://timer-app-yoga.jarvis1.fastmail.fm.user.fm")
          }
          title="Privacy Policy"
        />
      </View>
    </View>
  );
};

import { StyleSheet } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 0,
  },
  title: {
    color: tintColorLight,
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
