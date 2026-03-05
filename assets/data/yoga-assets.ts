import { YogaSvg } from "@/assets/images/svgx/yoga";
import { MountainPoseSvg } from "@/assets/images/svgx/yoga-poses/mountain-pose";
import { DownwardDogSvg } from "@/assets/images/svgx/yoga-poses/downward-dog";
import { MountainOverheadSvg } from "@/assets/images/svgx/yoga-poses/mountain-overhead";
import { UpwardFacingDogSvg } from "@/assets/images/svgx/yoga-poses/upward-facing-dog";
import { PlankSvg } from "@/assets/images/svgx/yoga-poses/plank";
import { ChaturangaSvg } from "@/assets/images/svgx/yoga-poses/chaturanga";
import { ForwardFoldSvg } from "@/assets/images/svgx/yoga-poses/forward-fold";
import { HalfwayLiftSvg } from "@/assets/images/svgx/yoga-poses/halfway-lift";
import { StandingPrayerSvg } from "@/assets/images/svgx/yoga-poses/standing-prayer";
import { StaffSvg } from "@/assets/images/svgx/yoga-poses/staff";
import { EasySeatSvg } from "@/assets/images/svgx/yoga-poses/easy-seat";
import { FireLogSvg } from "@/assets/images/svgx/yoga-poses/fire-log";
import { SeatedWideLeggedForwardFoldSvg } from "@/assets/images/svgx/yoga-poses/seated-wide-legged-forward-fold";
import { CobblersSvg } from "@/assets/images/svgx/yoga-poses/cobblers";

export type YogaAssetType = "svg" | "image" | "video";

export interface YogaAsset {
  id: string;
  type: YogaAssetType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  "mountain-overhead": {
    id: "mountain-overhead",
    type: "svg",
    asset: MountainOverheadSvg,
  },
  "upward-facing-dog": {
    id: "upward-facing-dog",
    type: "svg",
    asset: UpwardFacingDogSvg,
  },
  "plank": {
    id: "plank",
    type: "svg",
    asset: PlankSvg,
  },
  "chaturanga": {
    id: "chaturanga",
    type: "svg",
    asset: ChaturangaSvg,
  },
  "forward-fold": {
    id: "forward-fold",
    type: "svg",
    asset: ForwardFoldSvg,
  },
  "halfway-lift": {
    id: "halfway-lift",
    type: "svg",
    asset: HalfwayLiftSvg,
  },
  "standing-prayer": {
    id: "standing-prayer",
    type: "svg",
    asset: StandingPrayerSvg,
  },
  "staff": {
    id: "staff",
    type: "svg",
    asset: StaffSvg,
  },
  "easy-seat": {
    id: "easy-seat",
    type: "svg",
    asset: EasySeatSvg,
  },
  "fire-log": {
    id: "fire-log",
    type: "svg",
    asset: FireLogSvg,
  },
  "seated-wide-legged-forward-fold": {
    id: "seated-wide-legged-forward-fold",
    type: "svg",
    asset: SeatedWideLeggedForwardFoldSvg,
  },
  "cobblers": {
    id: "cobblers",
    type: "svg",
    asset: CobblersSvg,
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
