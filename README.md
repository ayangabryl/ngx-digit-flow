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

| Input                     | Type                                    | Default                 | Description                                                                        |
| ------------------------- | --------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------- |
| `value`                   | `number`                                | required                | The number to display and animate                                                  |
| `format`                  | `Intl.NumberFormatOptions`              | `{}`                    | Options forwarded to `Intl.NumberFormat`                                           |
| `locales`                 | `string \| string[]`                    | `undefined`             | BCP 47 locale string(s), including localized digit glyphs                          |
| `prefix`                  | `string`                                | `''`                    | Text prepended before the number                                                   |
| `suffix`                  | `string`                                | `''`                    | Text appended after the number                                                     |
| `animated`                | `boolean`                               | `true`                  | Set `false` to disable all animation                                               |
| `duration`                | `number`                                | `900`                   | Spin + FLIP animation duration in ms                                               |
| `opacityDuration`         | `number`                                | `450`                   | Fade duration for appearing/disappearing elements                                  |
| `transformTiming`         | `DigitFlowTiming`                       | `duration + flipEasing` | Full WAAPI timing for layout/FLIP animations                                       |
| `spinTiming`              | `DigitFlowTiming`                       | `transformTiming`       | Full WAAPI timing for digit spin animations                                        |
| `opacityTiming`           | `DigitFlowTiming`                       | `opacityDuration`       | Full WAAPI timing for fade animations                                              |
| `spinEasing`              | `DigitFlowEasing`                       | spring                  | Named preset (`spring`, `default`, `overshoot`) or CSS easing for digit spin       |
| `flipEasing`              | `DigitFlowEasing`                       | spring                  | Named preset (`spring`, `default`, `overshoot`) or CSS easing for layout motion    |
| `trend`                   | `number \| (oldValue, value) => number` | auto                    | Controls reel direction: `1`, `-1`, `0`, or custom                                 |
| `continuous`              | `boolean`                               | `false`                 | Visually ticks through intermediate values by looping unchanged lower-place digits |
| `digits`                  | `Record<number, { max?: number }>`      | `{}`                    | Configure digit reel ranges by decimal position                                    |
| `respectMotionPreference` | `boolean`                               | `true`                  | Disable animations when the user prefers reduced motion                            |
| `stagger`                 | `number`                                | `0`                     | Delay in ms between entering/exiting presence animations                           |
| `colorOnIncrease`         | `string`                                | `undefined`             | CSS color flashed when value increases                                             |
| `colorOnDecrease`         | `string`                                | `undefined`             | CSS color flashed when value decreases                                             |
| `spin3d`                  | `boolean`                               | `false`                 | Adds a subtle 3D cylinder effect to spinning digits                                |

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

**Forced trend direction**

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

**Group directive** (sync multiple instances)

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

## Browser support

Requires CSS `mod()` and `@property`: Chrome 125+, Safari 15.4+, Firefox 118+.

`prefers-reduced-motion` is respected automatically - no extra code needed.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT - see [LICENSE](LICENSE).
