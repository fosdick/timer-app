// Web stub — react-native-purchases (RevenueCat) is not supported on web.
// In-app purchases are available on iOS and Android only.
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const PaywallScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        In-app purchases are available on iOS and Android.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 24,
  },
  text: {
    color: "#687076",
    fontSize: 16,
    textAlign: "center",
  },
});

export default PaywallScreen;
