// Thinking Models - Editorial cognitive frameworks for STILLROOM

export interface LaneConfig {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ThinkingModel {
  id: string;
  name: string;
  description: string;
  whenToUse: string;
  whenNotToUse: string;
  steps: string[];
  shapeMapping: {
    circle: string;
    square: string;
    triangle: string;
  };
  lanes: LaneConfig[];
}

// Viewport-relative lane positions (percentages converted to pixels in component)
export const THINKING_MODELS: ThinkingModel[] = [
  {
    id: 'first-principles',
    name: 'First Principles',
    description: 'Strip away inherited assumptions to reveal what\'s actually true.',
    whenToUse: 'When borrowed ideas feel constraining. When you need a different foundation.',
    whenNotToUse: 'When the problem is simple or time-sensitive.',
    steps: [
      'Write down what everyone assumes to be true',
      'Ask: which of these are laws of nature, and which are just conventions?',
      'Isolate the fundamental truths—the things that can\'t be broken down further',
      'Build a new approach using only what remains'
    ],
    shapeMapping: {
      circle: 'Assumptions to question',
      square: 'Fundamental truths',
      triangle: 'New insights built from basics'
    },
    lanes: [
      { id: 'assumptions', label: 'Assumptions', x: 100, y: 100, width: 320, height: 600 },
      { id: 'fundamentals', label: 'Fundamentals', x: 460, y: 100, width: 320, height: 600 },
      { id: 'rebuild', label: 'Rebuild', x: 820, y: 100, width: 320, height: 600 }
    ]
  },
  {
    id: 'five-whys',
    name: '5 Whys',
    description: 'Resist the first answer. Keep asking until you hit something structural.',
    whenToUse: 'When symptoms keep recurring. When the obvious fix hasn\'t worked.',
    whenNotToUse: 'When surface-level action is enough, or when root causes are already clear.',
    steps: [
      'State the surface problem clearly—what\'s broken right now?',
      'Ask why it\'s happening. Write the answer down',
      'Take that answer and ask why again. Keep going',
      'Stop when you\'ve hit something structural, organizational, or cultural—usually around five layers deep'
    ],
    shapeMapping: {
      circle: 'Questions to explore',
      square: 'Facts discovered',
      triangle: 'Root causes identified'
    },
    lanes: [
      { id: 'why1', label: 'Why 1', x: 100, y: 80, width: 1000, height: 110 },
      { id: 'why2', label: 'Why 2', x: 100, y: 210, width: 1000, height: 110 },
      { id: 'why3', label: 'Why 3', x: 100, y: 340, width: 1000, height: 110 },
      { id: 'why4', label: 'Why 4', x: 100, y: 470, width: 1000, height: 110 },
      { id: 'why5', label: 'Why 5 (Root)', x: 100, y: 600, width: 1000, height: 110 }
    ]
  },
  {
    id: 'second-order',
    name: 'Second-Order Effects',
    description: 'Look past the immediate outcome and map what happens next—and after that.',
    whenToUse: 'When designing systems. When a decision will outlive the moment.',
    whenNotToUse: 'When you\'re solving something isolated or temporary.',
    steps: [
      'Identify the direct result of your decision',
      'Ask: what will people do in response to that result?',
      'Map the behavior changes, unintended incentives, and cultural shifts',
      'Trace how those changes reshape the original system'
    ],
    shapeMapping: {
      circle: 'Uncertainties ahead',
      square: 'Direct consequences',
      triangle: 'Critical decision points'
    },
    lanes: [
      { id: 'direct', label: 'Direct Effects', x: 100, y: 100, width: 320, height: 600 },
      { id: 'secondary', label: 'Secondary Effects', x: 460, y: 100, width: 320, height: 600 },
      { id: 'longterm', label: 'Long-term Ripples', x: 820, y: 100, width: 320, height: 600 }
    ]
  },
  {
    id: 'eisenhower',
    name: 'Eisenhower Matrix',
    description: 'Separate noise from signal by distinguishing urgent from important.',
    whenToUse: 'When your attention is fragmented. When everything feels like a priority.',
    whenNotToUse: 'When you already have clarity on what matters most.',
    steps: [
      'List everything demanding your time or attention',
      'Mark what\'s time-sensitive (urgent) vs. what\'s goal-aligned (important)',
      'Place each item in one of four quadrants',
      'Do the urgent-important now. Schedule the important. Delegate or drop the rest'
    ],
    shapeMapping: {
      circle: 'Items to evaluate',
      square: 'Important tasks',
      triangle: 'Urgent decisions'
    },
    lanes: [
      { id: 'urgent-important', label: 'Do First', x: 100, y: 80, width: 500, height: 310 },
      { id: 'not-urgent-important', label: 'Schedule', x: 640, y: 80, width: 500, height: 310 },
      { id: 'urgent-not-important', label: 'Delegate', x: 100, y: 430, width: 500, height: 310 },
      { id: 'not-urgent-not-important', label: 'Eliminate', x: 640, y: 430, width: 500, height: 310 }
    ]
  },
  {
    id: 'ice',
    name: 'ICE Prioritization',
    description: 'Score opportunities by impact, confidence, and ease to find leverage.',
    whenToUse: 'When you have more ideas than capacity. When building a roadmap from scratch.',
    whenNotToUse: 'When priorities are already clear or when intuition is enough.',
    steps: [
      'List the opportunities or features you\'re considering',
      'Rate each on Impact (1–10), Confidence (1–10), and Ease (1–10)',
      'Multiply the three scores together, then divide by 100',
      'Rank by ICE score—high scores are your highest-leverage bets'
    ],
    shapeMapping: {
      circle: 'Ideas to evaluate',
      square: 'High-impact opportunities',
      triangle: 'Quick wins to pursue'
    },
    lanes: [
      { id: 'impact', label: 'High Impact', x: 100, y: 100, width: 320, height: 600 },
      { id: 'confidence', label: 'High Confidence', x: 460, y: 100, width: 320, height: 600 },
      { id: 'ease', label: 'Easy to Execute', x: 820, y: 100, width: 320, height: 600 }
    ]
  }
];