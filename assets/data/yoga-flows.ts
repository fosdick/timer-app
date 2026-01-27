export interface YogaPose {
  name: string;
  duration: number; // seconds
  description?: string;
  progressText?: string;
  assetId?: string;
}

export interface YogaSuperset {
  type: "superset";
  totalDuration: number; // seconds - user self-paces through poses
  poses: YogaPose[];
  progressText?: string;
  assetId?: string;
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

// Import flow data from JSON
import flowsData from "./yoga-flows.json";

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
