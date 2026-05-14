import { FormattedNumber, NumberPart } from './digit-flow.types';

// Parts that belong before the integer digits
const PRE_TYPES = new Set(['currency', 'literal', 'minusSign', 'plusSign', 'nan', 'infinity']);
// Parts that belong after the fraction/integer
const POST_TYPES = new Set(['percentSign', 'unit']);

export interface DigitGlyph {
  value: number;
  glyph: string;
}

export function getDigitGlyphs(
  locales?: string | string[],
  options: Intl.NumberFormatOptions = {},
): DigitGlyph[] {
  const formatter = new Intl.NumberFormat(locales, {
    numberingSystem: options.numberingSystem,
    useGrouping: false,
    maximumFractionDigits: 0,
  });

  return Array.from({ length: 10 }, (_, value) => ({
    value,
    glyph: formatter.format(value),
  }));
}

function getDigitValueMap(
  locales?: string | string[],
  options: Intl.NumberFormatOptions = {},
): Map<string, number> {
  return new Map(getDigitGlyphs(locales, options).map(({ glyph, value }) => [glyph, value]));
}

export function formatToData(
  value: number,
  options: Intl.NumberFormatOptions = {},
  locales?: string | string[],
  prefix = '',
  suffix = '',
): FormattedNumber {
  const formatter = new Intl.NumberFormat(locales, options);
  const digitValues = getDigitValueMap(locales, options);
  const parts = formatter.formatToParts(value);

  const pre: NumberPart[] = [];
  const rawInteger: Intl.NumberFormatPart[] = [];
  const fraction: NumberPart[] = [];
  const post: NumberPart[] = [];

  // Track whether we've seen the first integer digit yet
  let seenInteger = false;
  let seenDecimal = false;

  for (const part of parts) {
    if (part.type === 'integer' || part.type === 'group') {
      seenInteger = true;
      rawInteger.push(part);
    } else if (part.type === 'decimal' || part.type === 'fraction') {
      seenDecimal = true;
      // keyed later
      fraction.push({ type: part.type, value: part.value, key: '' });
    } else if (!seenInteger && PRE_TYPES.has(part.type)) {
      pre.push({ type: part.type, value: part.value, key: `pre-${pre.length}` });
    } else if (seenInteger && POST_TYPES.has(part.type)) {
      post.push({ type: part.type, value: part.value, key: `post-${post.length}` });
    } else if (seenDecimal || seenInteger) {
      post.push({ type: part.type, value: part.value, key: `post-${post.length}` });
    } else {
      pre.push({ type: part.type, value: part.value, key: `pre-${pre.length}` });
    }
  }

  // Prepend custom prefix
  if (prefix) {
    pre.unshift({ type: 'prefix', value: prefix, key: '__prefix' });
  }
  // Append custom suffix
  if (suffix) {
    post.push({ type: 'suffix', value: suffix, key: '__suffix' });
  }

  // Split multi-character integer parts into individual digit characters.
  // Intl.NumberFormat returns e.g. {type:'integer', value:'000'} for groups between separators.
  const splitInteger: Intl.NumberFormatPart[] = [];
  for (const p of rawInteger) {
    if (p.type === 'integer') {
      for (const ch of p.value) {
        splitInteger.push({ type: 'integer', value: ch });
      }
    } else {
      splitInteger.push(p);
    }
  }

  // Assign right-anchored keys: ones digit = i0, tens = i1, hundreds = i2, etc.
  // Count total digits first so we know the positional offset.
  let digitIdx = 0;
  const reversedInteger: NumberPart[] = [];
  for (let i = splitInteger.length - 1; i >= 0; i--) {
    const p = splitInteger[i];
    if (p.type === 'integer') {
      reversedInteger.push({
        type: 'integer',
        value: p.value,
        key: `i${digitIdx}`,
        numericValue: digitValues.get(p.value) ?? Number(p.value),
      });
      digitIdx++;
    } else {
      // Group separator — keyed by digit offset to the right (e.g. g3 sits between i3 and i4)
      reversedInteger.push({ type: 'group', value: p.value, key: `g${digitIdx}` });
    }
  }
  const integerParts: NumberPart[] = reversedInteger.reverse();

  // Split multi-character fraction parts and assign keys
  let fracDigitIdx = 0;
  const keyedFraction: NumberPart[] = [];
  for (const p of fraction) {
    if (p.type === 'fraction') {
      for (const ch of p.value) {
        keyedFraction.push({
          type: 'fraction',
          value: ch,
          key: `f${++fracDigitIdx}`,
          numericValue: digitValues.get(ch) ?? Number(ch),
        });
      }
    } else {
      keyedFraction.push({ ...p, key: 'decimal' });
    }
  }

  return { pre, integer: integerParts, fraction: keyedFraction, post };
}
