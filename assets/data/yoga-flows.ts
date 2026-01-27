export interface YogaPose {
  name: string;
  duration: number; // seconds
  description?: string;
  progressText?: string;
}

export interface YogaSuperset {
  type: "superset";
  totalDuration: number; // seconds - user self-paces through poses
  poses: YogaPose[];
  progressText?: string;
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

// Predefined yoga flows
export const YOGA_FLOWS: YogaFlow[] = [
  {
    id: "sun-salutation-a",
    name: "Sun Salutation A",
    description: "Classic Surya Namaskar A sequence",
    items: [
      {
        name: "Mountain Pose",
        duration: 30,
        description: "Stand tall with feet together",
        progressText: "Pose 1 of 11",
      },
      {
        name: "Upward Salute",
        duration: 20,
        description: "Reach arms overhead",
        progressText: "Pose 2 of 11",
      },
      {
        name: "Forward Fold",
        duration: 30,
        description: "Fold forward from hips",
        progressText: "Pose 3 of 11",
      },
      {
        name: "Halfway Lift",
        duration: 20,
        description: "Lengthen spine",
        progressText: "Pose 4 of 11",
      },
      {
        name: "Plank",
        duration: 30,
        description: "Hold strong plank",
        progressText: "Pose 5 of 11",
      },
      {
        name: "Chaturanga",
        duration: 20,
        description: "Lower with control",
        progressText: "Pose 6 of 11",
      },
      {
        name: "Upward Dog",
        duration: 30,
        description: "Press chest forward",
        progressText: "Pose 7 of 11",
      },
      {
        name: "Downward Dog",
        duration: 45,
        description: "Press hips up and back",
        progressText: "Pose 8 of 11",
      },
      {
        name: "Forward Fold",
        duration: 30,
        description: "Step forward and fold",
        progressText: "Pose 9 of 11",
      },
      {
        name: "Upward Salute",
        duration: 20,
        description: "Rise up with arms overhead",
        progressText: "Pose 10 of 11",
      },
      {
        name: "Mountain Pose",
        duration: 30,
        description: "Return to standing",
        progressText: "Pose 11 of 11",
      },
    ],
    totalDuration: 305,
  },
  {
    id: "warrior-flow",
    name: "Warrior Flow",
    description: "Energizing warrior sequence with both sides",
    items: [
      {
        name: "Mountain Pose",
        duration: 30,
        description: "Stand tall and centered",
        progressText: "Pose 1 of 7",
      },
      {
        name: "Warrior I - Right",
        duration: 45,
        description: "Right foot forward, arms up",
        progressText: "Pose 2 of 7",
      },
      {
        name: "Warrior II - Right",
        duration: 45,
        description: "Open hips, arms parallel",
        progressText: "Pose 3 of 7",
      },
      {
        name: "Extended Side Angle - Right",
        duration: 40,
        description: "Forearm to thigh, extend top arm",
        progressText: "Pose 4 of 7",
      },
      {
        name: "Warrior I - Left",
        duration: 45,
        description: "Left foot forward, arms up",
        progressText: "Pose 5 of 7",
      },
      {
        name: "Warrior II - Left",
        duration: 45,
        description: "Open hips, arms parallel",
        progressText: "Pose 6 of 7",
      },
      {
        name: "Extended Side Angle - Left",
        duration: 40,
        description: "Forearm to thigh, extend top arm",
        progressText: "Pose 7 of 7",
      },
    ],
    totalDuration: 290,
  },
  {
    id: "pigeon-flow",
    name: "Pigeon Hip Opener",
    description: "Deep hip opening sequence with superset",
    items: [
      {
        name: "Downward Dog",
        duration: 30,
        description: "Start in down dog",
        progressText: "Warming up",
      },
      {
        type: "superset",
        totalDuration: 240,
        progressText: "Left leg pigeon - give yourself time for a down dog before right side",
        poses: [
          {
            name: "Pigeon Pose - Left",
            duration: 120,
            description: "Left shin forward, breathe deeply",
          },
          {
            name: "Downward Dog",
            duration: 30,
            description: "Transition to down dog",
          },
          {
            name: "Pigeon Pose - Right",
            duration: 120,
            description: "Right shin forward, breathe deeply",
          },
        ],
      },
      {
        name: "Child's Pose",
        duration: 60,
        description: "Rest and recover",
        progressText: "Final rest",
      },
    ],
    totalDuration: 330,
  },
];

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
