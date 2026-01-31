// Import flow data from JSON
import flowsData from "./yoga-flows.json";

export interface YogaPose {
  name: string;
  duration: number; // seconds
  description?: string;
  progressText?: string;
  assetId?: string;
  halfwayChime?: boolean; // Enable halfway point sound notification
}

export interface YogaSuperset {
  type: "superset";
  name: string; // Superset name (required) - displayed during flow
  totalDuration: number; // seconds - will be auto-calculated from poses
  poses: YogaPose[];
  progressText?: string; // DEPRECATED: Use 'name' instead (kept for backward compatibility)
  assetId?: string;
  halfwayChime?: boolean; // Default halfway chime for all poses in superset
}

export type YogaFlowItem = YogaPose | YogaSuperset;

export interface YogaFlow {
  id: string;
  name: string;
  description: string;
  items: YogaFlowItem[];
  totalDuration: number; // calculated from items
}

// Helper to check if item is a superset
export const isSuperset = (item: YogaFlowItem): item is YogaSuperset => {
  return (item as YogaSuperset).type === "superset";
};

// Type-cast imported JSON to ensure type safety
export const YOGA_FLOWS: YogaFlow[] = flowsData as YogaFlow[];

// Helper function to get a flow by ID
export const getFlowById = (flowId: string): YogaFlow | undefined => {
  return YOGA_FLOWS.find((flow) => flow.id === flowId);
};

// Helper to calculate total duration
export const calculateFlowDuration = (items: YogaFlowItem[]): number => {
  return items.reduce((total, item) => {
    if (isSuperset(item)) {
      return total + item.totalDuration;
    }
    return total + item.duration;
  }, 0);
};

// Helper to calculate superset duration from child poses
export const getSupersetDuration = (superset: YogaSuperset): number => {
  return superset.poses.reduce((sum, pose) => sum + pose.duration, 0);
};

// Helper to get superset name (supports backward compatibility)
export const getSupersetName = (superset: YogaSuperset): string => {
  return superset.name || superset.progressText || "Superset";
};
