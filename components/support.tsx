import React from "react";
import { View, Text, Button, Linking } from "react-native";
import { GreenTheme } from "@/assets/styles/timer-app";
import { Constants } from "@/constants/constants";

const Support = () => {
  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <Text style={styles.title}>App Suport</Text>
      </View>
      <View>
        <Button
          onPress={() =>
            Linking.openURL(
              `mailto:${Constants.SUPPORT_EMAI}?subject=Timer App Yoga`
            )
          }
          title={`Email: ${Constants.SUPPORT_EMAIL}`}
        />
      </View>
      <View>
        <Button
          onPress={() =>
            Linking.openURL(
              "https://app.fastmail.com/files/4905761455/4909401471?u=41d941ae"
            )
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
