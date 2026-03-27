/**
 * Smart Market Board Constants
 */

import type { VolumePeriod } from '@/types/smartBoard';

/** Minimum volume threshold for the volume filter (shares/day) */
export const SMART_BOARD_VOLUME_THRESHOLD = 500_000;

/** LocalStorage key for persisting filter state */
export const SMART_BOARD_LS_FILTERS = 'smart-board-filters';

/** Price color palette matching the upstream heatmap colours */
export const PRICE_COLORS = {
  ceiling: { bg: 'bg-purple-900/60',  text: 'text-purple-300' },
  floor:   { bg: 'bg-cyan-900/60',    text: 'text-cyan-300'   },
  up:      { bg: 'bg-green-900/40',   text: 'text-green-400'  },
  down:    { bg: 'bg-red-900/40',     text: 'text-red-400'    },
  ref:     { bg: 'bg-gray-800/60',    text: 'text-gray-400'   },
} as const;

/** Available volume period options for the filter bar */
export const VOLUME_PERIOD_OPTIONS: { value: VolumePeriod; label: string; days: number }[] = [
  { value: '1d',  label: '1 Ngày',   days: 1  },
  { value: '7d',  label: '1 Tuần',   days: 7  },
  { value: '30d', label: '1 Tháng',  days: 30 },
];
