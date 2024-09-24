import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Image, Platform, View, Text, TouchableOpacity } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Metronome from '@/components/metronome';

export default function TabTwoScreen() {


  return (
    <View style={styles.viewBody}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Pranayama Timer</ThemedText>
        
      </ThemedView>
      <ThemedView>
      <Metronome></Metronome>
      </ThemedView>
     
    </View>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  viewBody: {
    marginTop:30
  }
});
