# ngx-digit-flow

Individual digit animations for Angular. Each digit has a vertical reel (0-9) that scrolls to the new value when the number changes - slot-machine / odometer style.

Built on Web Animations API + CSS `@property`. Zero dependencies. SSR-safe. Signals-first.

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
  template: `<ngx-digit-flow [value]="price()" [format]="{ style: 'currency', currency: 'USD' }" />`
})
export class PriceComponent {
  price = signal(182.50);
}
```

## API

### Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `value` | `number` | required | The number to display and animate |
| `format` | `Intl.NumberFormatOptions` | `{}` | Options forwarded to `Intl.NumberFormat` |
| `locales` | `string \| string[]` | `undefined` | BCP 47 locale string(s) |
| `prefix` | `string` | `''` | Text prepended before the number |
| `suffix` | `string` | `''` | Text appended after the number |
| `animated` | `boolean` | `true` | Set `false` to disable all animation |
| `duration` | `number` | `900` | Animation duration in ms |
| `opacityDuration` | `number` | `150` | Fade duration for appearing/disappearing elements |

### Outputs

| Output | Payload | Description |
|---|---|---|
| `animationsStart` | `void` | Fires when a batch of animations begins |
| `animationsFinish` | `void` | Fires when all in-flight animations settle |

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
<ngx-digit-flow
  [value]="views()"
  [format]="{ notation: 'compact', maximumFractionDigits: 1 }"
/>
```

**Percentage**
```html
<ngx-digit-flow
  [value]="progress()"
  [format]="{ style: 'percent', maximumFractionDigits: 1 }"
/>
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
