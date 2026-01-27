import { YogaSvg } from "@/assets/images/svgx/yoga";
import { MountainPoseSvg } from "@/assets/images/svgx/yoga-poses/mountain-pose";
import { DownwardDogSvg } from "@/assets/images/svgx/yoga-poses/downward-dog";
import { Warrior1Svg } from "@/assets/images/svgx/yoga-poses/warrior-1";

export type YogaAssetType = "svg" | "image" | "video";

export interface YogaAsset {
  id: string;
  type: YogaAssetType;
  asset: any; // React component for SVG, require() for image/video
}

export const YOGA_ASSETS: Record<string, YogaAsset> = {
  generic: {
    id: "generic",
    type: "svg",
    asset: YogaSvg,
  },
  "mountain-pose": {
    id: "mountain-pose",
    type: "svg",
    asset: MountainPoseSvg,
  },
  "downward-dog": {
    id: "downward-dog",
    type: "svg",
    asset: DownwardDogSvg,
  },
  "warrior-1": {
    id: "warrior-1",
    type: "svg",
    asset: Warrior1Svg,
  },
};

/**
 * Get a yoga asset by ID with fallback to generic
 * @param assetId - Optional asset ID to look up
 * @returns YogaAsset - The requested asset or generic fallback
 */
export const getYogaAsset = (assetId?: string): YogaAsset => {
  if (!assetId) {
    return YOGA_ASSETS["generic"];
  }

  const asset = YOGA_ASSETS[assetId];
  if (!asset) {
    console.warn(`Yoga asset not found: ${assetId}, using fallback`);
    return YOGA_ASSETS["generic"];
  }

  return asset;
};
