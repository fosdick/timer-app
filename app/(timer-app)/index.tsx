import Ionicons from "@expo/vector-icons/Ionicons";
import {
  StyleSheet,
  Image,
  Platform,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Pranayama from "@/components/pranayama";

export default function TabTwoScreen(props: any) {
  return (
    <ThemedView style={styles.viewBody}>
      <View>
        <Pranayama eventController={props?.eventController}></Pranayama>
      </View>
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
    // backgroundColor: 'none'
  },
});
