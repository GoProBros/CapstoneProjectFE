import { Pencil, SplitSquareVertical, Square, Activity } from 'lucide-react';
import { TrendingUp as TrendingUpIcon } from 'lucide-react';

export const CHART_INDICATORS = [
  { name: 'MA' },
  { name: 'EMA' },
  { name: 'VOL' },
  { name: 'MACD' },
  { name: 'RSI' },
  { name: 'BOLL' },
];

export const DRAWING_TOOL_GROUPS = [
  {
    id: 'all-tools',
    name: 'Drawing Tools',
    icon: Pencil,
    tools: [
      { id: 'horizontalStraightLine', name: 'Horizontal Line', overlayName: 'horizontalStraightLine' },
      { id: 'horizontalRayLine', name: 'Horizontal Ray', overlayName: 'horizontalRayLine' },
      { id: 'horizontalSegment', name: 'Horizontal Segment', overlayName: 'horizontalSegment' },
      { id: 'verticalStraightLine', name: 'Vertical Line', overlayName: 'verticalStraightLine' },
      { id: 'verticalRayLine', name: 'Vertical Ray', overlayName: 'verticalRayLine' },
      { id: 'verticalSegment', name: 'Vertical Segment', overlayName: 'verticalSegment' },
      { id: 'segment', name: 'Trend Line', overlayName: 'segment' },
      { id: 'rayLine', name: 'Ray', overlayName: 'rayLine' },
    ],
  },
  {
    id: 'channels',
    name: 'Channels',
    icon: SplitSquareVertical,
    tools: [
      { id: 'priceChannelLine', name: 'Price Channel Line', overlayName: 'priceChannelLine' },
      { id: 'parallelStraightLine', name: 'Parallel Line', overlayName: 'parallelStraightLine' },
    ],
  },
  {
    id: 'shapes',
    name: 'Shapes',
    icon: Square,
    tools: [
      { id: 'circle', name: 'Circle', overlayName: 'circle' },
      { id: 'rect', name: 'Rect', overlayName: 'rect' },
      { id: 'parallelogram', name: 'Parallelogram', overlayName: 'parallelogram' },
      { id: 'triangle', name: 'Triangle', overlayName: 'triangle' },
    ],
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci & Gann',
    icon: TrendingUpIcon,
    tools: [
      { id: 'fibonacciLine', name: 'Fibonacci Line', overlayName: 'fibonacciLine' },
    ],
  },
  {
    id: 'patterns',
    name: 'Patterns',
    icon: Activity,
    tools: [
      { id: 'xabcd', name: 'XABCD Pattern', overlayName: 'xabcd' },
      { id: 'abcd', name: 'ABCD Pattern', overlayName: 'abcd' },
      { id: 'threeWaves', name: 'Three Waves', overlayName: 'threeWaves' },
      { id: 'fiveWaves', name: 'Five Waves', overlayName: 'fiveWaves' },
      { id: 'eightWaves', name: 'Eight Waves', overlayName: 'eightWaves' },
      { id: 'anyWaves', name: 'Any Waves', overlayName: 'anyWaves' },
    ],
  },
];
