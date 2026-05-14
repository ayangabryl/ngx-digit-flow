---
name: ngx-digit-flow
description: >
  Install, configure, and use ngx-digit-flow, the Angular digit animation library
  that animates individual digits slot-machine style (like number-flow but for Angular).
  Use this skill whenever a user wants to add animated number displays, slot-machine
  digit counters, odometer-style counting, or any live number transitions in an Angular app.
  Trigger on: "add ngx-digit-flow", "install ngx-digit-flow", "animated numbers Angular",
  "digit animation", "number counter animation", "slot machine numbers", "odometer Angular",
  "ngx-digit-flow", or any request to make numbers animate digit-by-digit in Angular.
---

# ngx-digit-flow

An Angular library that animates individual digits independently — slot-machine / odometer style.
Each digit has a vertical reel (0–9) that scrolls to the new value when the number changes.
Built on Web Animations API + CSS `@property`. Zero dependencies. SSR-safe. Signals-first.

## Installation

```bash
npm install ngx-digit-flow
```

No additional setup. The library is standalone — just import and use.

## Quick start

```typescript
// In your Angular component
import { DigitFlowComponent } from 'ngx-digit-flow';

@Component({
  imports: [DigitFlowComponent],
  template: `<ngx-digit-flow [value]="price()" [format]="{ style: 'currency', currency: 'USD' }" />`
})
export class PriceDisplayComponent {
  price = signal(182.50);
}
```

## All inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `value` | `number` | **required** | The number to display and animate |
| `format` | `Intl.NumberFormatOptions` | `{}` | Standard `Intl.NumberFormat` options |
| `locales` | `string \| string[]` | `undefined` | BCP 47 locale(s) passed to `Intl.NumberFormat` |
| `prefix` | `string` | `''` | Text prepended before the number (e.g. `'~'`) |
| `suffix` | `string` | `''` | Text appended after the number (e.g. `' pts'`) |
| `animated` | `boolean` | `true` | Set `false` to disable all animation |
| `duration` | `number` | `900` | Spin + FLIP animation duration in ms |
| `opacityDuration` | `number` | `150` | Fade-in/out duration for appearing/disappearing elements |

## Outputs

| Output | Payload | Description |
|---|---|---|
| `animationsStart` | `void` | Fires when a batch of animations begins |
| `animationsFinish` | `void` | Fires when all in-flight animations settle |

## Common usage examples

### Currency

```html
<ngx-digit-flow
  [value]="revenue()"
  [format]="{ style: 'currency', currency: 'USD' }"
  [duration]="600"
/>
```

### Score counter with +/− buttons

```typescript
score = signal(0);
```
```html
<ngx-digit-flow [value]="score()" [duration]="500" />
<button (click)="score.update(v => v - 1)">−</button>
<button (click)="score.update(v => v + 1)">+</button>
```

### Compact notation (K / M / B)

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

### Countdown timer

```typescript
seconds = signal(60);

ngOnInit() {
  setInterval(() => this.seconds.update(s => Math.max(0, s - 1)), 1000);
}
```
```html
<ngx-digit-flow [value]="seconds()" [suffix]="'s'" [duration]="600" />
```

### Locale-aware

```html
<ngx-digit-flow
  [value]="amount()"
  [locales]="'de-DE'"
  [format]="{ style: 'currency', currency: 'EUR' }"
/>
```

### Disable animation (e.g. for reduced-motion or SSR)

```html
<ngx-digit-flow [value]="count()" [animated]="false" />
```

## Wiring into a feature component

When a user asks you to add `ngx-digit-flow` to an existing component, follow this pattern:

1. **Install** — run `npm install ngx-digit-flow` (or confirm they've done it)
2. **Import** — add `DigitFlowComponent` to the `imports` array of the host component
3. **Replace** the static number rendering with `<ngx-digit-flow [value]="..." />`
4. **Add format** — infer the right `Intl.NumberFormatOptions` from context (currency, percent, etc.)
5. **Choose duration** — `600–900ms` for dashboards/tickers, `400–500ms` for interactive controls

Keep the reactive source (signal, observable via `async`, etc.) as-is — `ngx-digit-flow` only needs a `number` input.

## How the animation works (for context)

Knowing this helps when users ask to customize or debug:

- **CSS `@property --_df-d`** — A typed `<number>` custom property registered via `@property`. The browser can interpolate and accumulate it.
- **`composite: 'accumulate'`** — Multiple in-flight WAAPI animations ADD their `--_df-d` contributions. Rapid value changes stack cleanly without JS position tracking.
- **CSS `mod()` infinite reel** — Each digit span calculates its vertical offset via `mod(10 + n - mod(current + delta, 10), 10)`, giving a truly infinite reel. No guard-reel overflow is possible regardless of how fast values change.
- **Trend-aware direction** — When a number increases, all digits scroll upward (like an odometer counting up). When it decreases, they scroll downward. The direction is determined by `Math.sign(newValue − prevValue)`.
- **FLIP** — When digit count changes (e.g. 99 → 100), existing digits animate horizontally to their new positions using `getBoundingClientRect()` snapshots.
- **`prefers-reduced-motion`** — Automatically sets duration to 0 when the user's OS preference requests reduced motion.
- **SSR-safe** — All Web Animations API calls are gated behind `isPlatformBrowser()`.

## Troubleshooting

**Numbers show but don't animate**
- Check browser support: requires Chrome 125+, Safari 15.4+, Firefox 118+ (needs CSS `mod()` and `@property`)
- Check `[animated]="true"` (it's the default, but verify it's not accidentally bound to false)
- Check `prefers-reduced-motion` system setting

**Digits misaligned or wrong size**
- `ngx-digit-flow` renders as `inline-block`. Wrap in a `flex` or `inline-flex` container if you need alignment control.
- Font must be loaded before initial render — use `font-display: block` if using a web font

**Value jumps instead of animating on first change**
- This is expected — the initial render shows the value instantly; animation only runs on *changes*

**`animationsFinish` never fires**
- Only emitted when `animated` is true and the browser supports the required CSS features
