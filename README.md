# ngx-digit-flow

Individual digit animations for Angular. Each digit has a vertical reel (0-9) that scrolls to the new value when the number changes - slot-machine / odometer style.

Built on Web Animations API + CSS `@property`. No animation libraries. SSR-safe. Signals-first.

**Website:** [ngx-digit-flow.ayangabryl.com](https://ngx-digit-flow.ayangabryl.com)

[![npm](https://img.shields.io/npm/v/ngx-digit-flow)](https://www.npmjs.com/package/ngx-digit-flow)
[![license](https://img.shields.io/github/license/ayangabryl/ngx-digit-flow)](LICENSE)

## Install

```bash
npm install ngx-digit-flow
```

## Quick start

Import the standalone component and bind it to a number.

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

## AI skill

Install the `ngx-digit-flow` skill so your AI assistant knows the full API and can wire it into your components:

```bash
npx skills add https://github.com/ayangabryl/ngx-digit-flow --skill ngx-digit-flow
```

Works with Claude Code and any agent that supports the [Agent Skills](https://anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) format.

## Usage

```typescript
import { DigitFlowComponent } from 'ngx-digit-flow';

@Component({
  imports: [DigitFlowComponent],
  template: `<ngx-digit-flow
    [value]="price()"
    [format]="{ style: 'currency', currency: 'USD' }"
  />`,
})
export class PriceComponent {
  price = signal(182.5);
}
```

## API

### Inputs

| Input                     | Type                                    | Default                 | Description                                                                          |
| ------------------------- | --------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| `value`                   | `number`                                | required                | The number to display and animate                                                    |
| `format`                  | `Intl.NumberFormatOptions`              | `{}`                    | Options forwarded to `Intl.NumberFormat`                                             |
| `locales`                 | `string \| string[]`                    | `undefined`             | BCP 47 locale string(s), including localized digit glyphs                            |
| `prefix`                  | `string`                                | `''`                    | Text prepended before the number                                                     |
| `suffix`                  | `string`                                | `''`                    | Text appended after the number                                                       |
| `animated`                | `boolean`                               | `true`                  | Set `false` to disable all animation                                                 |
| `duration`                | `number`                                | `900`                   | Spin + FLIP animation duration in ms                                                 |
| `opacityDuration`         | `number`                                | `450`                   | Fade duration for appearing/disappearing elements                                    |
| `transformTiming`         | `DigitFlowTiming`                       | `duration + flipEasing` | Full WAAPI timing for layout/FLIP animations                                         |
| `spinTiming`              | `DigitFlowTiming`                       | `transformTiming`       | Full WAAPI timing for digit spin animations                                          |
| `opacityTiming`           | `DigitFlowTiming`                       | `opacityDuration`       | Full WAAPI timing for fade animations                                                |
| `spinEasing`              | `DigitFlowEasing`                       | spring                  | Named preset (`spring`, `default`, `overshoot`) or CSS easing for digit spin         |
| `flipEasing`              | `DigitFlowEasing`                       | spring                  | Named preset (`spring`, `default`, `overshoot`) or CSS easing for layout motion      |
| `trend`                   | `number \| (oldValue, value) => number` | auto                    | Controls digit path: `1` counts up, `-1` counts down, `0` per-digit local, or custom |
| `continuous`              | `boolean`                               | `false`                 | Visually ticks through intermediate values by looping unchanged lower-place digits   |
| `digits`                  | `Record<number, { max?: number }>`      | `{}`                    | Configure digit reel ranges by decimal position                                      |
| `respectMotionPreference` | `boolean`                               | `true`                  | Disable animations when the user prefers reduced motion                              |
| `stagger`                 | `number`                                | `0`                     | Delay in ms between entering/exiting presence animations                             |
| `colorOnIncrease`         | `string`                                | `undefined`             | CSS color flashed when value increases                                               |
| `colorOnDecrease`         | `string`                                | `undefined`             | CSS color flashed when value decreases                                               |

### Outputs

| Output             | Payload | Description                                |
| ------------------ | ------- | ------------------------------------------ |
| `animationsStart`  | `void`  | Fires when a batch of animations begins    |
| `animationsFinish` | `void`  | Fires when all in-flight animations settle |

## Examples

**Currency**

```html
<ngx-digit-flow
  [value]="revenue()"
  [format]="{ style: 'currency', currency: 'USD' }"
  [duration]="600"
/>
```

**Compact notation (K / M / B)**

```html
<ngx-digit-flow [value]="views()" [format]="{ notation: 'compact', maximumFractionDigits: 1 }" />
```

**Percentage**

```html
<ngx-digit-flow [value]="progress()" [format]="{ style: 'percent', maximumFractionDigits: 1 }" />
```

**Localized digits**

```html
<ngx-digit-flow [value]="12345" locales="ar-EG" />
```

**Forced digit path**

```html
<ngx-digit-flow [value]="value()" [trend]="-1" />
```

**Score counter**

```typescript
score = signal(0);
```

```html
<ngx-digit-flow [value]="score()" [duration]="500" />
<button (click)="score.update(v => v - 1)">-</button>
<button (click)="score.update(v => v + 1)">+</button>
```

**Group directive** (coordinate related counters)

```typescript
import { DigitFlowGroupDirective } from 'ngx-digit-flow';
```

```html
<div ngxDigitFlowGroup>
  <ngx-digit-flow [value]="hours" />
  <span>:</span>
  <ngx-digit-flow [value]="minutes" />
  <span>:</span>
  <ngx-digit-flow [value]="seconds" />
</div>
```

Use `ngxDigitFlowGroup` when separate numbers form one visual unit. The directive batches
their pre-update snapshots so unchanged siblings can still animate layout shifts caused by
another value changing.

## Browser support

Requires CSS `mod()` and `@property`: Chrome 125+, Safari 15.4+, Firefox 118+.

`prefers-reduced-motion` is respected automatically - no extra code needed.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT - see [LICENSE](LICENSE).
