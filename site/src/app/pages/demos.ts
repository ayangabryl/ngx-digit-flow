import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DigitFlowComponent, DigitFlowGroupDirective } from 'ngx-digit-flow';

@Component({
  selector: 'app-demos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DigitFlowComponent, DigitFlowGroupDirective],
  template: `
    <div class="demos-page">
      <header class="page-header">
        <h1 class="page-title">Demos</h1>
        <p class="page-sub">Every number is a live <code>ngx-digit-flow</code> instance.</p>
      </header>

      <div class="bento">

        <!-- AAPL Stock — 2 cols × 2 rows (big card) -->
        <div class="card card--trend">
          <div class="trend-head">
            <span class="card-label">{{ ticker }}</span>
            <span class="trend-badge" [class.up]="trendUp()" [class.down]="!trendUp()">
              {{ trendUp() ? '▲' : '▼' }}&nbsp;<ngx-digit-flow
                [value]="trendPctNum()"
                [format]="trendPctFmt"
                [suffix]="'%'"
                [duration]="400"
              />
            </span>
          </div>
          <div class="trend-price" [class.trend-up]="trendUp()" [class.trend-down]="!trendUp()">
            <ngx-digit-flow
              [value]="stockPrice()"
              [format]="stockFmt"
              [duration]="600"
            />
          </div>
          <div class="sparkline-wrap">
            <svg class="sparkline" viewBox="0 0 200 60" preserveAspectRatio="none">
              <defs>
                <linearGradient [id]="'spark-fill'" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"
                    [attr.stop-color]="trendUp() ? 'oklch(62% 0.18 145)' : 'oklch(62% 0.18 25)'"
                    stop-opacity="0.25" />
                  <stop offset="100%"
                    [attr.stop-color]="trendUp() ? 'oklch(62% 0.18 145)' : 'oklch(62% 0.18 25)'"
                    stop-opacity="0" />
                </linearGradient>
              </defs>
              @if (sparklineArea()) {
                <path [attr.d]="sparklineArea()" fill="url(#spark-fill)" />
              }
              @if (sparklinePoints()) {
                <polyline
                  [attr.points]="sparklinePoints()"
                  fill="none"
                  [attr.stroke]="trendUp() ? 'oklch(62% 0.18 145)' : 'oklch(62% 0.18 25)'"
                  stroke-width="1.5"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />
              }
            </svg>
          </div>
          <span class="card-foot-note">NASDAQ · updates every 2 s</span>
        </div>

        <!-- Countdown -->
        <div class="card card--countdown">
          <span class="card-label">Countdown</span>
          <div class="card-center">
            <ngx-digit-flow
              [value]="countdown()"
              [suffix]="' s'"
              [duration]="600"
            />
          </div>
        </div>

        <!-- Score -->
        <div class="card card--score">
          <span class="card-label">Score</span>
          <div class="card-center">
            <ngx-digit-flow [value]="score()" [duration]="500" />
          </div>
          <div class="score-btns">
            <button class="score-btn" (click)="score.update(v => v - 1)">−</button>
            <button class="score-btn" (click)="score.update(v => v + 1)">+</button>
          </div>
        </div>

        <!-- Compact notation -->
        <div class="card card--compact">
          <span class="card-label">Compact</span>
          <div class="card-center">
            <ngx-digit-flow
              [value]="compact()"
              [format]="compactFmt"
              [duration]="700"
            />
          </div>
          <span class="card-foot-note">K / M / B notation</span>
        </div>

        <!-- Progress -->
        <div class="card card--progress">
          <span class="card-label">Progress</span>
          <div class="card-center">
            <ngx-digit-flow
              [value]="progress()"
              [format]="progressFmt"
              [duration]="220"
            />
          </div>
          <div class="progress-track">
            <div class="progress-fill" [style.width.%]="progress() * 100"></div>
          </div>
        </div>

        <!-- Slider — 2 cols × 1 row -->
        <div class="card card--slider">
          <span class="card-label">Slider</span>
          <div class="card-center slider-value">
            <ngx-digit-flow
              [value]="sliderVal()"
              [format]="sliderFmt"
              [duration]="300"
            />
          </div>
          <div class="slider-wrap">
            <input
              class="slider-input"
              type="range"
              min="0"
              max="1000000"
              step="1000"
              [value]="sliderVal()"
              (input)="onSliderChange($event)"
            />
            <div class="slider-labels">
              <span>$0</span>
              <span>$1,000,000</span>
            </div>
          </div>
        </div>

        <!-- Pricing tiers -->
        <div class="card card--pricing">
          <span class="card-label">Pricing</span>
          <div class="pricing-tier">{{ pricingTier() }}</div>
          <div class="card-center">
            <ngx-digit-flow
              [value]="pricingVal()"
              [format]="pricingFmt"
              [duration]="700"
            />
          </div>
          <div class="pricing-cycle">/ month</div>
        </div>

        <!-- Temperature toggle -->
        <div class="card card--temp">
          <span class="card-label">Temperature</span>
          <div class="card-center">
            <ngx-digit-flow
              [value]="tempDisplay()"
              [format]="tempFmt"
              [suffix]="tempUnit()"
              [duration]="600"
            />
          </div>
          <div class="temp-btns">
            <button class="temp-btn" [class.active]="tempCelsius()" (click)="tempCelsius.set(true)">°C</button>
            <button class="temp-btn" [class.active]="!tempCelsius()" (click)="tempCelsius.set(false)">°F</button>
          </div>
        </div>

        <!-- Duration comparison -->
        <div class="card card--duration">
          <div class="duration-head">
            <span class="card-label">Duration</span>
            <button class="trigger-btn" (click)="triggerDuration()">Trigger ↻</button>
          </div>
          <div class="duration-row" ngxDigitFlowGroup>
            @for (d of durationDemos; track d.label) {
              <div class="duration-item">
                <span class="duration-label">{{ d.label }}</span>
                <ngx-digit-flow
                  [value]="durationVal()"
                  [duration]="d.ms"
                />
              </div>
            }
          </div>
        </div>

        <!-- Currency / locale -->
        <div class="card card--locale">
          <span class="card-label">Locale</span>
          <div class="card-center">
            <ngx-digit-flow
              [value]="1_234_567.89"
              [format]="localeFmt()"
              [locales]="localeStr()"
              [duration]="900"
            />
          </div>
          <div class="locale-btns">
            @for (opt of localeOptions; track opt.locale) {
              <button
                class="locale-btn"
                [class.active]="localeStr() === opt.locale"
                (click)="setLocale(opt)"
              >{{ opt.label }}</button>
            }
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .demos-page {
      padding: 40px 32px 56px;
      max-width: 1100px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 28px;
    }

    .page-title {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.025em;
      margin: 0 0 5px;
    }

    .page-sub {
      font-size: 14px;
      color: var(--muted);
      margin: 0;
      font-weight: 400;
    }

    .page-sub code {
      font-family: var(--mono);
      font-size: 12px;
      color: var(--ink);
    }

    /* ── Bento grid ─────────────────────────── */
    .bento {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: 216px 216px 216px 216px;
      gap: 12px;
    }

    .card {
      border-radius: 24px;
      padding: 20px 22px 20px;
      display: flex;
      flex-direction: column;
      background: #fff;
      overflow: hidden;
      min-width: 0;
      box-shadow:
        0 1px 1px oklch(0% 0 0 / 0.04),
        0 4px 12px oklch(0% 0 0 / 0.07),
        0 0 0 0.5px oklch(0% 0 0 / 0.05);
    }

    .card-label {
      font-family: var(--font);
      font-size: 11px;
      font-weight: 400;
      color: oklch(62% 0.003 265);
      flex-shrink: 0;
      letter-spacing: 0;
    }

    .card-center {
      flex: 1;
      display: flex;
      align-items: center;
      font-size: 3.6rem;
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 1;
    }

    /* ── AAPL: col 1–2, row 1–2 ─────────────── */
    .card--trend {
      grid-column: 1 / 3;
      grid-row: 1 / 3;
    }

    .trend-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .trend-badge {
      font-family: var(--font);
      font-size: 11px;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 100px;
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
    .trend-badge.up   { background: oklch(93% 0.07 145); color: oklch(42% 0.18 145); }
    .trend-badge.down { background: oklch(94% 0.06 25);  color: oklch(44% 0.18 25);  }

    .trend-price {
      flex: 1;
      display: flex;
      align-items: center;
      font-size: 4.6rem;
      font-weight: 700;
      letter-spacing: -0.05em;
      line-height: 1;
    }
    .trend-price.trend-up   { color: oklch(42% 0.18 145); }
    .trend-price.trend-down { color: oklch(44% 0.18 25);  }

    .sparkline-wrap {
      height: 68px;
      flex-shrink: 0;
      margin: 0 -2px 8px;
    }

    .sparkline {
      width: 100%;
      height: 100%;
      display: block;
    }

    /* ── Countdown: col 3, row 1 ─────────────── */
    .card--countdown {
      grid-column: 3 / 4;
      grid-row: 1 / 2;
    }

    /* ── Score: col 4, row 1 ─────────────────── */
    .card--score {
      grid-column: 4 / 5;
      grid-row: 1 / 2;
    }

    .score-btns {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .score-btn {
      flex: 1;
      height: 34px;
      border: 1px solid oklch(88% 0.002 265);
      border-radius: 100px;
      background: transparent;
      font-size: 20px;
      font-family: var(--font);
      line-height: 1;
      color: var(--ink);
      cursor: pointer;
      transition: background 0.12s;
    }
    .score-btn:hover { background: oklch(96% 0.001 265); }

    /* ── Compact: col 3, row 2 ───────────────── */
    .card--compact {
      grid-column: 3 / 4;
      grid-row: 2 / 3;
    }

    .card-foot-note {
      font-family: var(--font);
      font-size: 11px;
      color: oklch(68% 0.003 265);
      flex-shrink: 0;
    }

    /* ── Progress: col 4, row 2 ──────────────── */
    .card--progress {
      grid-column: 4 / 5;
      grid-row: 2 / 3;
    }

    .progress-track {
      height: 5px;
      background: oklch(92% 0.002 265);
      border-radius: 100px;
      overflow: hidden;
      flex-shrink: 0;
      margin-top: 8px;
    }

    .progress-fill {
      height: 100%;
      background: oklch(56% 0.22 255);
      border-radius: 100px;
      transition: width 0.22s linear;
    }

    /* ── Slider: col 1–2, row 3 ──────────────── */
    .card--slider {
      grid-column: 1 / 3;
      grid-row: 3 / 4;
    }

    .slider-value {
      font-size: 3.6rem;
    }

    .slider-wrap {
      flex-shrink: 0;
      padding: 2px 0 0;
    }

    .slider-input {
      width: 100%;
      -webkit-appearance: none;
      appearance: none;
      height: 4px;
      background: oklch(91% 0.002 265);
      border-radius: 100px;
      outline: none;
      cursor: pointer;
      display: block;
      accent-color: oklch(56% 0.22 255);
    }
    .slider-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #fff;
      border: none;
      cursor: pointer;
      box-shadow: 0 1px 3px oklch(0% 0 0 / 0.15), 0 0 0 1px oklch(88% 0.002 265);
    }
    .slider-input::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #fff;
      border: none;
      cursor: pointer;
      box-shadow: 0 1px 3px oklch(0% 0 0 / 0.15), 0 0 0 1px oklch(88% 0.002 265);
    }

    .slider-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 7px;
      font-family: var(--font);
      font-size: 11px;
      color: var(--muted);
    }

    /* ── Pricing: col 3, row 3 ───────────────── */
    .card--pricing {
      grid-column: 3 / 4;
      grid-row: 3 / 4;
    }

    .pricing-tier {
      font-family: var(--font);
      font-size: 11px;
      color: oklch(52% 0.16 255);
      font-weight: 600;
      flex-shrink: 0;
      margin-top: 2px;
      letter-spacing: 0;
    }

    .pricing-cycle {
      font-family: var(--font);
      font-size: 11px;
      color: oklch(68% 0.003 265);
      flex-shrink: 0;
    }

    /* ── Temperature: col 4, row 3 ───────────── */
    .card--temp {
      grid-column: 4 / 5;
      grid-row: 3 / 4;
    }

    .temp-btns {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }

    .temp-btn {
      flex: 1;
      height: 32px;
      font-family: var(--font);
      font-size: 13px;
      font-weight: 500;
      border: 1px solid oklch(88% 0.002 265);
      border-radius: 100px;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      transition: all 0.12s;
    }
    .temp-btn:hover { color: var(--ink); border-color: oklch(70% 0.003 265); }
    .temp-btn.active { background: oklch(56% 0.22 255); color: #fff; border-color: oklch(56% 0.22 255); }

    /* ── Duration: col 1–2, row 4 ────────────── */
    .card--duration {
      grid-column: 1 / 3;
      grid-row: 4 / 5;
    }

    .duration-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      margin-bottom: 12px;
    }

    .trigger-btn {
      font-family: var(--font);
      font-size: 12px;
      font-weight: 500;
      color: var(--muted);
      background: transparent;
      border: 1px solid oklch(88% 0.002 265);
      border-radius: 100px;
      padding: 6px 13px;
      cursor: pointer;
      transition: border-color 0.12s, color 0.12s;
    }
    .trigger-btn:hover { border-color: var(--ink); color: var(--ink); }

    .duration-row {
      flex: 1;
      display: flex;
      align-items: flex-end;
      gap: 0;
    }

    .duration-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .duration-label {
      font-family: var(--font);
      font-size: 11px;
      color: var(--muted);
    }

    .duration-item ngx-digit-flow {
      font-size: 2.6rem;
      font-weight: 700;
      letter-spacing: -0.04em;
    }

    /* ── Locale: col 3–4, row 4 ──────────────── */
    .card--locale {
      grid-column: 3 / 5;
      grid-row: 4 / 5;
    }

    .locale-btns {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }

    .locale-btn {
      font-family: var(--font);
      font-size: 12px;
      font-weight: 500;
      padding: 6px 14px;
      border: 1px solid oklch(88% 0.002 265);
      border-radius: 100px;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      transition: all 0.12s;
    }
    .locale-btn:hover { color: var(--ink); border-color: oklch(70% 0.003 265); }
    .locale-btn.active {
      background: oklch(56% 0.22 255);
      color: #fff;
      border-color: oklch(56% 0.22 255);
    }

    /* ── Responsive ─────────────────────────── */
    @media (max-width: 900px) {
      .demos-page { padding: 32px 20px 48px; }
      .bento {
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: none;
      }
      .card--trend     { grid-column: 1 / 3; grid-row: 1 / 2; }
      .card--countdown { grid-column: 1 / 2; grid-row: 2 / 3; }
      .card--score     { grid-column: 2 / 3; grid-row: 2 / 3; }
      .card--compact   { grid-column: 1 / 2; grid-row: 3 / 4; }
      .card--progress  { grid-column: 2 / 3; grid-row: 3 / 4; }
      .card--slider    { grid-column: 1 / 3; grid-row: 4 / 5; }
      .card--pricing   { grid-column: 1 / 2; grid-row: 5 / 6; }
      .card--temp      { grid-column: 2 / 3; grid-row: 5 / 6; }
      .card--duration  { grid-column: 1 / 3; grid-row: 6 / 7; }
      .card--locale    { grid-column: 1 / 3; grid-row: 7 / 8; }
      .trend-price     { font-size: 3rem; }
      .sparkline-wrap  { height: 52px; }
      .card-center     { font-size: 2.8rem; }
      .slider-value    { font-size: 2.8rem; }
    }

    @media (max-width: 520px) {
      .bento { grid-template-columns: 1fr; }
      .card--trend,
      .card--countdown,
      .card--score,
      .card--compact,
      .card--progress,
      .card--slider,
      .card--pricing,
      .card--temp,
      .card--duration,
      .card--locale { grid-column: 1 / 2; grid-row: auto; }
    }
  `],
})
export class DemosComponent implements OnInit {
  protected countdown = signal(30);
  protected score = signal(0);

  protected compact = signal(1200);
  protected compactFmt: Intl.NumberFormatOptions = {
    notation: 'compact',
    maximumFractionDigits: 1,
  } as Intl.NumberFormatOptions;
  private compactValues = [1200, 15_400, 2_100_000, 150_000_000];
  private compactIdx = 0;

  protected progress = signal(0);
  protected progressFmt: Intl.NumberFormatOptions = {
    style: 'percent',
    maximumFractionDigits: 0,
  };

  // AAPL stock
  protected readonly ticker = 'AAPL';
  protected stockPrice   = signal(182.50);
  protected trendUp      = signal(true);
  protected trendPctNum  = signal(0);
  private   priceHistory = signal<number[]>([182.50]);

  protected stockFmt: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  };
  protected trendPctFmt: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  protected sparklinePoints = computed(() => {
    const prices = this.priceHistory();
    if (prices.length < 2) return '';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const w = 200, h = 56;
    return prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * w;
      const y = h - ((p - min) / range) * (h - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  });

  protected sparklineArea = computed(() => {
    const prices = this.priceHistory();
    if (prices.length < 2) return '';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const w = 200, h = 56;
    const pts = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * w;
      const y = h - ((p - min) / range) * (h - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${pts.join(' L ')} L 200,${h} L 0,${h} Z`;
  });

  // Slider
  protected sliderVal  = signal(50_000);
  protected sliderFmt: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  };

  // Pricing tiers
  private pricingTiers = [
    { label: 'Starter',    price: 9.99   },
    { label: 'Pro',        price: 29.99  },
    { label: 'Business',   price: 79.99  },
    { label: 'Enterprise', price: 199.00 },
  ];
  private pricingIdx = 0;
  protected pricingVal  = signal(this.pricingTiers[0].price);
  protected pricingTier = signal(this.pricingTiers[0].label);
  protected pricingFmt: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  };

  // Temperature
  protected tempCelsius = signal(true);
  private tempC = signal(22);
  protected tempDisplay = computed(() => {
    const c = this.tempC();
    return this.tempCelsius()
      ? c
      : parseFloat((c * 9 / 5 + 32).toFixed(1));
  });
  protected tempFmt: Intl.NumberFormatOptions = { maximumFractionDigits: 1 };
  protected tempUnit = computed(() => this.tempCelsius() ? ' °C' : ' °F');

  protected durationVal = signal(42);
  protected durationDemos = [
    { label: '300 ms',  ms: 300  },
    { label: '900 ms',  ms: 900  },
    { label: '1800 ms', ms: 1800 },
  ];
  private durationValues = [42, 1337, 7, 9999, 100, 0, 512];
  private durationIdx = 0;

  protected localeOptions = [
    { label: 'USD', locale: 'en-US', currency: 'USD' },
    { label: 'EUR', locale: 'de-DE', currency: 'EUR' },
    { label: 'JPY', locale: 'ja-JP', currency: 'JPY' },
  ];
  protected localeFmt = signal<Intl.NumberFormatOptions>({
    style: 'currency',
    currency: 'USD',
  });
  protected localeStr = signal<string>('en-US');

  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    const ids: ReturnType<typeof setInterval>[] = [];

    ids.push(setInterval(() => {
      this.countdown.update(v => v <= 0 ? 30 : v - 1);
    }, 600));

    ids.push(setInterval(() => {
      this.compactIdx = (this.compactIdx + 1) % this.compactValues.length;
      this.compact.set(this.compactValues[this.compactIdx]);
    }, 2000));

    ids.push(setInterval(() => {
      this.progress.update(v => v >= 1 ? 0 : parseFloat((v + 0.025).toFixed(3)));
    }, 200));

    // Stock ticker + sparkline history
    ids.push(setInterval(() => {
      const prev   = this.stockPrice();
      const change = (Math.random() - 0.48) * 4;
      const next   = Math.max(100, parseFloat((prev + change).toFixed(2)));
      const pct    = parseFloat(Math.abs((next - prev) / prev * 100).toFixed(2));
      this.trendUp.set(next >= prev);
      this.trendPctNum.set(pct);
      this.stockPrice.set(next);
      this.priceHistory.update(h => [...h.slice(-29), next]);
    }, 2000));

    // Pricing tier cycle
    ids.push(setInterval(() => {
      this.pricingIdx = (this.pricingIdx + 1) % this.pricingTiers.length;
      const tier = this.pricingTiers[this.pricingIdx];
      this.pricingTier.set(tier.label);
      this.pricingVal.set(tier.price);
    }, 2500));

    // Temperature oscillation
    let tempPhase = 0;
    ids.push(setInterval(() => {
      tempPhase += 0.15;
      const c = parseFloat((22 + Math.sin(tempPhase) * 8).toFixed(1));
      this.tempC.set(c);
    }, 800));

    this.destroyRef.onDestroy(() => ids.forEach(id => clearInterval(id)));
  }

  protected triggerDuration(): void {
    this.durationIdx = (this.durationIdx + 1) % this.durationValues.length;
    this.durationVal.set(this.durationValues[this.durationIdx]);
  }

  protected setLocale(opt: { locale: string; currency: string; label: string }): void {
    this.localeFmt.set({ style: 'currency', currency: opt.currency });
    this.localeStr.set(opt.locale);
  }

  protected onSliderChange(event: Event): void {
    this.sliderVal.set(+(event.target as HTMLInputElement).value);
  }
}
