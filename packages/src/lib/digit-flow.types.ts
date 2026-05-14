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

export type DigitFlowTrend = number | ((oldValue: number, value: number) => number);

export type DigitFlowTiming = Omit<KeyframeAnimationOptions, 'composite'>;

export interface DigitFlowDigitConfig {
  max?: number;
}

export type DigitFlowDigits = Record<number, DigitFlowDigitConfig>;
