import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Image, Platform, View, Text, TouchableOpacity } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import HittView from '@/components/hitt-view';

import { useState } from 'react';

export default function TabTwoScreen() {

const [yogaInterval, setYogaInterval] = useState("00:oo");

  return (
    <ThemedView style={styles.viewBody}>
     
     <HittView></HittView>
     
     
     
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
