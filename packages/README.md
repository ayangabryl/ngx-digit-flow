# ngx-digit-flow

Smooth odometer-style digit animations for Angular.

`ngx-digit-flow` animates each changing digit on its own vertical reel, giving numbers the polished slot-machine / odometer motion you see in modern dashboards, counters, timers, pricing UI, stats, and any interface where numbers update.

Built for Angular with Signals, the Web Animations API, and CSS `@property`. SSR-safe. No animation libraries.

**Demo:** [ngx-digit-flow.ayangabryl.com](https://ngx-digit-flow.ayangabryl.com)  
**GitHub:** [github.com/ayangabryl/ngx-digit-flow](https://github.com/ayangabryl/ngx-digit-flow)

[![npm](https://img.shields.io/npm/v/ngx-digit-flow)](https://www.npmjs.com/package/ngx-digit-flow)
[![license](https://img.shields.io/github/license/ayangabryl/ngx-digit-flow)](https://github.com/ayangabryl/ngx-digit-flow/blob/main/LICENSE)

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
    <ngx-digit-flow
      [value]="price()"
      [format]="{ style: 'currency', currency: 'USD' }"
    />
  `,
})
export class PriceComponent {
  price = signal(182.5);
}
```

## Why use it?

- Smooth per-digit odometer animations
- Works with `Intl.NumberFormatOptions`
- Supports currency, percentages, compact notation, decimals, prefixes, and suffixes
- Signals-first Angular API
- SSR-safe browser checks
- Respects `prefers-reduced-motion`
- No animation libraries

## Examples

### Currency

```html
<ngx-digit-flow
  [value]="revenue()"
  [format]="{ style: 'currency', currency: 'USD' }"
  [duration]="600"
/>
```

### Compact notation

```html
<ngx-digit-flow
  [value]="views()"
  [format]="{ notation: 'compact', maximumFractionDigits: 1 }"
/>
```

### Percentage

```html
<ngx-digit-flow
  [value]="progress()"
  [format]="{ style: 'percent', maximumFractionDigits: 1 }"
/>
```

### Counter

```typescript
score = signal(0);
```

```html
<ngx-digit-flow [value]="score()" [duration]="500" />

<button type="button" (click)="score.update(value => value - 1)">-</button>
<button type="button" (click)="score.update(value => value + 1)">+</button>
```

### Timer or grouped digits

Use `ngxDigitFlowGroup` when multiple instances should animate together.

```typescript
import { DigitFlowComponent, DigitFlowGroupDirective } from 'ngx-digit-flow';
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

## API

### Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | required | The number to display and animate |
| `format` | `Intl.NumberFormatOptions` | `{}` | Options forwarded to `Intl.NumberFormat` |
| `locales` | `string \| string[]` | `undefined` | BCP 47 locale string or list of locale strings |
| `prefix` | `string` | `''` | Text prepended before the formatted number |
| `suffix` | `string` | `''` | Text appended after the formatted number |
| `animated` | `boolean` | `true` | Set to `false` to disable animation |
| `duration` | `number` | `900` | Digit animation duration in milliseconds |
| `opacityDuration` | `number` | `150` | Fade duration for appearing or disappearing parts |

### Outputs

| Output | Payload | Description |
| --- | --- | --- |
| `animationsStart` | `void` | Fires when an animation batch starts |
| `animationsFinish` | `void` | Fires when all in-flight animations finish |

## AI assistant setup

Install the `ngx-digit-flow` skill so an AI coding assistant can understand the API and wire it into your Angular components.

```bash
npx skills add https://github.com/ayangabryl/ngx-digit-flow --skill ngx-digit-flow
```

Works with Claude Code and any coding agent that supports the Agent Skills format.

## Browser support

Requires CSS `mod()` and `@property`.

- Chrome 125+
- Safari 15.4+
- Firefox 118+

`prefers-reduced-motion` is respected automatically.

## License

MIT
