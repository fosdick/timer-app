import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet } from "react-native";

import { ThemedView } from "@/components/ThemedView";
import YogaView from "@/components/yoga-view";
import { useState } from "react";
import { useKeepAwake } from "expo-keep-awake";

export default function TabTwoScreen() {
  useKeepAwake();
  return (
    <ThemedView style={styles.viewBody}>
      <YogaView></YogaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  viewBody: {
    marginTop: 30,
    alignItems: "center",
    // backgroundColor: 'none'
  },
});
