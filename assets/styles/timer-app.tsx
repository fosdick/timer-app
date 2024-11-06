import { StyleSheet } from "react-native";

// const fontColor = "#3670A5";
const fontColor = "#629231";
const borderColor = "#91BD27";
const thumbTintColor = "#4b6806";
const trackColorFalse = "#0D2013";
const minimumTrackTintColor = "#3C4E16";
const thumbColorDisabled = "#0D2013";
const maximumTrackTintColor = "#767577";
const backgroundColor = "#080B0c";
const neutralColor = "#dfffea";

export const Settings = StyleSheet.create({
  regText: {
    // marginTop:30,
    // paddingVertical: 10,
    paddingHorizontal: 18,
    fontSize: 25,
    overflow: "hidden",
    borderColor: borderColor,
    color: fontColor,
    fontVariant: ["tabular-nums"],
  },
});
export const GreenTheme = {
  borderColor,
  fontColor,
  trackColorFalse,
  thumbTintColor,
  thumbColorDisabled,
  minimumTrackTintColor,
  maximumTrackTintColor,
  backgroundColor,
};
export const TimerStyles = StyleSheet.create({
  vertBox: {
    // borderWidth: 1,
    // borderBlockColor: "#333",
    flex: 2,
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
  },
  marginTop: {
    marginTop: 30,
  },
  marginTopXL: {
    marginTop: 70,
  },
  metronomeTheme: {
    // backgroundColor: '#DBD6D2',
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  timerFace: {
    // marginTop:30,
    // paddingVertical: 10,
    paddingHorizontal: 18,
    fontSize: 85,
    overflow: "hidden",
    borderColor: borderColor,
    color: fontColor,
    fontVariant: ["tabular-nums"],
  },
  timerFaceSmall: {
    // marginTop:30,
    // paddingVertical: 10,
    paddingHorizontal: 18,
    fontSize: 55,
    overflow: "hidden",
    borderColor: borderColor,
    color: fontColor,
    fontVariant: ["tabular-nums"],
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
    // marginTop: 15,
    paddingVertical: 5,
    paddingHorizontal: 18,
    fontSize: 16,
    overflow: "hidden",
    borderColor: borderColor,
    color: fontColor,
  },
  metronomeMedium: {
    marginTop: 0,
    paddingVertical: 5,
    paddingHorizontal: 18,
    fontSize: 30,
    overflow: "hidden",
    borderColor: borderColor,
    color: fontColor,
    fontVariant: ["tabular-nums"],
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
    fontSize: 16,
  },
});
export const screenStyles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  BannerAdBottom: {
    position: "absolute",
    margin: 0,
    padding: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  viewBody: {
    flex: 1,
  },
});
