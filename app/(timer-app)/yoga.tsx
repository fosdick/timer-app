import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Image, Platform, View, Text, TouchableOpacity } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Metronome from '@/components/metronome';
import YogaView from '@/components/yoga-view';
import Clock from '@/components/Clock'
import { useState } from 'react';

export default function TabTwoScreen() {

const [yogaInterval, setYogaInterval] = useState("00:00");

  return (
    <ThemedView style={styles.viewBody}>
     
     <YogaView yogaInterval={yogaInterval} setYogaInterval={{setYogaInterval}}></YogaView>
     
      
     
     
    </ThemedView>
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
    marginTop:30,
    // backgroundColor: 'none'
  }
});
