export interface NumberPart {
  type: string;
  value: string;
  key: string;
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
