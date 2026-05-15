---
name: ngx-digit-flow
description: >
  Install, configure, and use ngx-digit-flow, the Angular digit animation library
  that animates numbers with reel-based digit motion, accumulated WAAPI animation,
  continuous ticker visuals, and locale-aware digit glyphs. Use when adding animated
  counters, prices, timers, odometers, scoreboards, dashboards, or any live number
  transition in Angular.
---

# ngx-digit-flow

`ngx-digit-flow` is a standalone Angular component for polished digit-by-digit number animation.
It is zero-dependency, SSR-safe, signal-friendly, locale-aware, and built on the Web Animations API,
CSS `@property`, and CSS math.

Use it when a user wants polished animated numbers in Angular.

## Install

```bash
npm install ngx-digit-flow
```

## Quick Start

```typescript
import { Component, signal } from '@angular/core';
import { DigitFlowComponent } from 'ngx-digit-flow';

@Component({
  selector: 'app-price',
  imports: [DigitFlowComponent],
  template: `
    <ngx-digit-flow [value]="price()" [format]="{ style: 'currency', currency: 'USD' }" />
  `,
})
export class PriceComponent {
  price = signal(182.5);
}
```

## Public API

| Input                     | Type                                    | Default                 | Guidance                                                                                                                             |
| ------------------------- | --------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `value`                   | `number`                                | required                | The number to display and animate.                                                                                                   |
| `format`                  | `Intl.NumberFormatOptions`              | `{}`                    | Forwarded to `Intl.NumberFormat`; use for currency, percent, compact notation, grouping, fraction digits.                            |
| `locales`                 | `string \| string[]`                    | `undefined`             | Locale and numbering system support, including non-Latin digit glyphs.                                                               |
| `prefix`                  | `string`                                | `''`                    | Custom text before the formatted number. Prefer `format` for real currency/sign/unit formatting.                                     |
| `suffix`                  | `string`                                | `''`                    | Custom text after the formatted number. Prefer `format` for percent/unit when possible.                                              |
| `animated`                | `boolean`                               | `true`                  | Set `false` to disable all animation.                                                                                                |
| `duration`                | `number`                                | `900`                   | Shared spin + layout duration in milliseconds.                                                                                       |
| `opacityDuration`         | `number`                                | `450`                   | Presence fade duration for entering/exiting digits, separators, and literals.                                                        |
| `spinEasing`              | `DigitFlowEasing`                       | `spring`                | Named preset (`spring`, `default`, `overshoot`) or any CSS easing string. Use the default unless the user asks for a different feel. |
| `flipEasing`              | `DigitFlowEasing`                       | `spring`                | Same presets/raw CSS support for horizontal layout motion.                                                                           |
| `transformTiming`         | `DigitFlowTiming`                       | `duration + flipEasing` | Full WAAPI timing for layout/FLIP and container width motion. Overrides `duration`/`flipEasing`.                                     |
| `spinTiming`              | `DigitFlowTiming`                       | `transformTiming`       | Full WAAPI timing for vertical digit reel motion. Overrides `duration`/`spinEasing`.                                                 |
| `opacityTiming`           | `DigitFlowTiming`                       | `opacityDuration`       | Full WAAPI timing for presence fades.                                                                                                |
| `trend`                   | `number \| (oldValue, value) => number` | auto                    | Controls digit path. Use `1` to count up, `-1` to count down, `0` per-digit local direction, or a function.                          |
| `continuous`              | `boolean`                               | `false`                 | Visual continuity mode: lower unchanged digits loop one full reel when a higher-place digit changes.                                 |
| `digits`                  | `Record<number, { max?: number }>`      | `{}`                    | Custom reel ranges by decimal position, e.g. `{ 1: { max: 5 } }` for clock tens.                                                     |
| `respectMotionPreference` | `boolean`                               | `true`                  | Skips animations when `prefers-reduced-motion: reduce` is active.                                                                    |
| `stagger`                 | `number`                                | `0`                     | Delay in ms between entering/exiting presence animations only. Core spin and layout remain synchronized.                             |
| `colorOnIncrease`         | `string`                                | `undefined`             | Flash color when value increases.                                                                                                    |
| `colorOnDecrease`         | `string`                                | `undefined`             | Flash color when value decreases.                                                                                                    |

| Output             | Payload | Guidance                                                                                     |
| ------------------ | ------- | -------------------------------------------------------------------------------------------- |
| `animationsStart`  | `void`  | Fires once when an animation batch starts. Interrupted batches do not emit duplicate starts. |
| `animationsFinish` | `void`  | Fires once when all in-flight batches settle, including interrupted/out-of-order batches.    |

## Best-Practice Defaults

Prefer the standard component before reaching for timing overrides. The default spring is the recommended baseline:

```html
<ngx-digit-flow [value]="n" />
```

Only use `spinEasing="overshoot"` or `flipEasing="overshoot"` when the user explicitly asks for a snappier, bouncier, or more playful feel. Do not recommend overshoot by default.

For currency and product metrics:

```html
<ngx-digit-flow
  [value]="revenue()"
  [format]="{ style: 'currency', currency: 'USD' }"
  [continuous]="true"
/>
```

For compact dashboards:

```html
<ngx-digit-flow [value]="views()" [format]="{ notation: 'compact', maximumFractionDigits: 1 }" />
```

For countdown or clock-like reels:

```html
<ngx-digit-flow [value]="seconds()" [digits]="{ 1: { max: 5 } }" [trend]="-1" />
```

## Current Animation Model

The implementation uses a reel-based WAAPI animation model:

- **One visual update, not queued DOM steps.** Continuous mode does not render `121, 122, ...` as intermediate Angular states. It creates the illusion by spinning lower unchanged digits one full reel.
- **CSS custom-property deltas.** `--_df-d`, `--_df-d-opacity`, `--_df-d-width`, and `--_df-dx` are animated as typed CSS properties.
- **`composite: 'accumulate'`.** Rapid changes stack without snapping because WAAPI animations accumulate deltas.
- **CSS `mod()` reel math.** Each digit computes its circular position from `current + delta`, so reels wrap smoothly.
- **Spring timing.** Default spin and layout use a 100-point spring `linear(...)`; opacity defaults to 450ms ease-out.
- **Presence stagger only.** `stagger` delays newly entering/exiting digits and separators. Do not stagger core spin or layout because it desynchronizes the number.
- **Capability-gated animation.** Animation requires WAAPI, CSS `@property`, CSS `mod()`, and WAAPI `linear(...)` easing support. Otherwise the component still renders the final value.

## Agent Implementation Checklist

When adding `ngx-digit-flow` to an Angular component:

1. Install the package if missing.
2. Import `DigitFlowComponent` in the standalone component `imports`.
3. Replace static number text with `<ngx-digit-flow [value]="..." />`.
4. Prefer `format`/`locales` over hand-built prefixes/suffixes for currency, percent, units, compact notation, and localized digits.
5. Use `continuous` for counters where higher-place changes should feel like they tick through values.
6. Keep the default spring easing unless the user asks for a custom feel. If they ask for snappy/playful motion, then suggest `spinEasing="overshoot"` or `flipEasing="overshoot"`.
7. Use `stagger` only to reveal entering/exiting parts; do not expect it to affect same-width number updates.
8. Preserve accessibility: the component renders screen-reader text; do not hide it with extra `aria-hidden` wrappers.

## Troubleshooting

**Numbers render but do not animate**

- Browser may not support CSS `mod()`, CSS `@property`, WAAPI, or WAAPI `linear(...)`.
- `animated` may be false.
- The document may be hidden.
- `prefers-reduced-motion` may be active while `respectMotionPreference` is true.

**`stagger` looks like nothing happens**

- Same-shape updates intentionally look the same. `stagger` only affects entering/exiting parts such as new digits, removed digits, group separators, literals, or decimals.

**Continuous looks different from a JS counter**

- This is expected. It is a visual continuity effect, not a JavaScript loop through every integer.

**Custom digit ranges show wrong values**

- Ensure `digits` is keyed by decimal position from the right: `i0`/position `0` is ones, `1` is tens, `2` is hundreds.

**Need to coordinate multiple values**

- Import `DigitFlowGroupDirective` and wrap related instances:

```html
<div ngxDigitFlowGroup>
  <ngx-digit-flow [value]="hours()" />
  <span>:</span>
  <ngx-digit-flow [value]="minutes()" [digits]="{ 1: { max: 5 } }" />
</div>
```

- Use grouping when separate counters form one visual unit. The directive batches pre-update
  snapshots so unchanged siblings can still animate layout shifts caused by another grouped value.
