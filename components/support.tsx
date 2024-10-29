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

${JSON.stringify(customerInfoData)}

`
    : "";

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <Text style={styles.title}>App Suport</Text>
      </View>
      <View>
        <Button
          onPress={() =>
            Linking.openURL(
              `mailto:${Constants.SUPPORT_EMAIL}?subject=Timer App Yoga&body=${customerBody}`
            )
          }
          title={`Email: ${Constants.SUPPORT_EMAIL}`}
        />
      </View>
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
    padding: 8,
  },
  title: {
    color: tintColorLight,
    fontSize: 36,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "#687076",
    paddingTop: 100,
    alignItems: "center",
  },
  terms: {
    color: "darkgrey",
  },
});

export default Support;
