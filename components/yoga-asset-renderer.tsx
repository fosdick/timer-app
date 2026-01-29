import React from "react";
import { Image } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { getYogaAsset } from "@/assets/data/yoga-assets";

interface YogaAssetRendererProps {
  assetId?: string;
  width: number;
  height: number;
  color?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: any; // Style can be for SVG, Image, or Video components
  isPlaying?: boolean; // for video control
}

export default function YogaAssetRenderer({
  assetId,
  width,
  height,
  color,
  style,
  isPlaying = false,
}: YogaAssetRendererProps) {
  const yogaAsset = getYogaAsset(assetId);

  switch (yogaAsset.type) {
    case "svg":
      const SvgComponent = yogaAsset.asset;
      return (
        <SvgComponent width={width} height={height} color={color} style={style} />
      );

    case "image":
      return (
        <Image
          source={yogaAsset.asset}
          style={[{ width, height }, style]}
          resizeMode="contain"
        />
      );

    case "video":
      return (
        <Video
          source={yogaAsset.asset}
          style={[{ width, height }, style]}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={isPlaying}
          isLooping
          useNativeControls={false}
        />
      );

    default:
      return null;
  }
}
