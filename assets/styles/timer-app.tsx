import {StyleSheet} from 'react-native';


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
    borderColor: "#65BABF",
    color: "#3670A5",
    fontVariant: ['tabular-nums']
    },
    timePicker: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderWidth: 1,
        borderRadius: 10,
        fontSize: 16,
        overflow: "hidden",
        borderColor: "#65BABF",
        color: "#3670A5"
        },
        startButton: {
          paddingVertical: 18,
          paddingHorizontal: 48,
          borderWidth: 1,
          borderRadius: 10,
          fontSize: 16,
          overflow: "hidden",
          borderColor: "#65BABF",
          color: "#3670A5"
          },
        metronome: {
          marginTop:15,
          paddingVertical: 5,
          paddingHorizontal: 18,
          fontSize: 16,
          overflow: "hidden",
          borderColor: "#65BABF",
          color: "#3670A5"
          },
          valueText: {
              
              paddingVertical: 10,
              paddingHorizontal: 18,
              fontSize: 16,
              fontWeight: 400,
              overflow: "hidden",
              borderColor: "#65BABF",
              color: "#3670A5"
              },
              small: {
                fontSize:16,
              }
          

});