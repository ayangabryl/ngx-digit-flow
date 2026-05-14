export interface NumberPart {
  type: string;
  value: string;
  key: string;
  numericValue?: number;
}

export interface FormattedNumber {
  pre: NumberPart[];
  integer: NumberPart[];
  fraction: NumberPart[];
  post: NumberPart[];
}

export const EMPTY_FORMATTED: FormattedNumber = {
  pre: [],
  integer: [],
  fraction: [],
  post: [],
};

/**
 * Pre-configured animation presets that control duration and easing.
 * - `default`: 900ms spring (odometer feel)
 * - `gaming`: 280ms overshoot spring (snappy, energetic)
 * - `metrics`: 800ms ease-out (smooth dashboard)
 * - `finance`: 1400ms spring (slow, professional)
 * - `smooth`: 750ms material ease (clean, modern)
 */
export type DigitFlowVariant = 'default' | 'gaming' | 'metrics' | 'finance' | 'smooth';

export type DigitFlowTrend = number | ((oldValue: number, value: number) => number);
