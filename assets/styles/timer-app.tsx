import {StyleSheet} from 'react-native';

// const fontColor = '#3670A5';
const fontColor = '#629231';
const borderColor = '#91BD27';
const trackColorTrue = '#4b6806';
const trackColorFalse = '#0D2013';
const thumbColorEnabled = '#3C4E16'
const thumbColorDisabled = '#0D2013';
const minimumTrackTintColor='#C3D8DB';
const maximumTrackTintColor='#767577';
const backgroundColor = '#080B0c';



export const GreenTheme = {
    borderColor,
    fontColor,
    trackColorFalse,
    trackColorTrue,
    thumbColorDisabled,
    thumbColorEnabled,
    minimumTrackTintColor,
    maximumTrackTintColor,
    backgroundColor


}
export const TimerStyles = StyleSheet.create({

    marginTop: {
        marginTop: 30
    },
    metronomeTheme: {
        // backgroundColor: '#DBD6D2',
        alignItems: "center", 
        justifyContent: "center",
    },

timerFace: {
    // marginTop:30,
    // paddingVertical: 10,
    paddingHorizontal: 18,
    fontSize: 75,
    overflow: "hidden",
    borderColor: borderColor,
    color: fontColor,
    fontVariant: ['tabular-nums']
    },
    timePicker: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderWidth: 1,
        borderRadius: 10,
        fontSize: 16,
        overflow: "hidden",
        borderColor: borderColor,
        color: fontColor,
        },
        startButton: {
          paddingVertical: 18,
          paddingHorizontal: 48,
          borderWidth: 1,
          borderRadius: 10,
          fontSize: 16,
          overflow: "hidden",
          borderColor: borderColor,
          color: fontColor,
          },
        metronome: {
          marginTop:15,
          paddingVertical: 5,
          paddingHorizontal: 18,
          fontSize: 16,
          overflow: "hidden",
          borderColor: borderColor,
          color: fontColor,
          },
          valueText: {
              
              paddingVertical: 10,
              paddingHorizontal: 18,
              fontSize: 16,
              fontWeight: 400,
              overflow: "hidden",
              borderColor: borderColor,
              color: fontColor,
              },
              small: {
                fontSize:16,
              }
          

});