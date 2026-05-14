import {
  Component,
  computed,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DigitFlowComponent } from 'ngx-digit-flow';

// ── Revenue Counter ──────────────────────────────────────────────────────────
@Component({
  selector: 'app-example-revenue',
  standalone: true,
  imports: [DigitFlowComponent],
  template: `
    <div class="ex-card">
      <div class="ex-card__label">Live Revenue</div>
      <ngx-digit-flow
        [value]="revenue()"
        [format]="fmt"
        class="ex-number ex-number--lg"
      />
      <div class="ex-card__sub">Updates every second</div>
    </div>
  `,
})
export class ExRevenueComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  revenue = signal(48291);
  fmt: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 };
  private t?: ReturnType<typeof setInterval>;
  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.t = setInterval(() => {
        this.revenue.update(v => v + Math.floor(Math.random() * 5000) + 500);
      }, 1200);
    }
  }
  ngOnDestroy() { clearInterval(this.t); }
}

// ── Score Counter ────────────────────────────────────────────────────────────
@Component({
  selector: 'app-example-score',
  standalone: true,
  imports: [DigitFlowComponent],
  template: `
    <div class="ex-card">
      <div class="ex-card__label">Score Counter</div>
      <ngx-digit-flow [value]="score()" class="ex-number ex-number--lg" />
      <div class="ex-card__actions">
        <button class="ex-btn ex-btn--red" (click)="score.update(v => Math.max(0, v - 10))">−10</button>
        <button class="ex-btn ex-btn--green" (click)="score.update(v => v + 10)">+10</button>
      </div>
    </div>
  `,
})
export class ExScoreComponent {
  score = signal(0);
  Math = Math;
}

// ── Countdown Timer ──────────────────────────────────────────────────────────
@Component({
  selector: 'app-example-countdown',
  standalone: true,
  imports: [DigitFlowComponent],
  template: `
    <div class="ex-card">
      <div class="ex-card__label">Countdown</div>
      <ngx-digit-flow [value]="count()" class="ex-number ex-number--lg" />
      <div class="ex-card__actions">
        <button class="ex-btn" (click)="reset()">Reset</button>
      </div>
    </div>
  `,
})
export class ExCountdownComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  count = signal(60);
  private t?: ReturnType<typeof setInterval>;
  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.t = setInterval(() => {
        this.count.update(v => v > 0 ? v - 1 : 60);
      }, 900);
    }
  }
  reset() { this.count.set(60); }
  ngOnDestroy() { clearInterval(this.t); }
}

// ── Percentage ───────────────────────────────────────────────────────────────
@Component({
  selector: 'app-example-percent',
  standalone: true,
  imports: [DigitFlowComponent],
  template: `
    <div class="ex-card">
      <div class="ex-card__label">Progress</div>
      <div class="ex-progress">
        <div class="ex-progress__bar" [style.width.%]="pct()"></div>
      </div>
      <ngx-digit-flow
        [value]="pct() / 100"
        [format]="fmt"
        class="ex-number ex-number--md"
      />
    </div>
  `,
  styles: [`
    .ex-progress {
      width: 100%;
      height: 6px;
      background: rgba(255,255,255,0.08);
      border-radius: 100px;
      overflow: hidden;
      margin-bottom: 1rem;
    }
    .ex-progress__bar {
      height: 100%;
      background: linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 100%);
      border-radius: 100px;
      transition: width 0.9s cubic-bezier(0.16,1,0.3,1);
    }
  `],
})
export class ExPercentComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  pct = signal(0);
  fmt: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 0 };
  private t?: ReturnType<typeof setInterval>;
  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.t = setInterval(() => {
        this.pct.update(v => (v + 7) % 101);
      }, 700);
    }
  }
  ngOnDestroy() { clearInterval(this.t); }
}

// ── Compact Notation ─────────────────────────────────────────────────────────
@Component({
  selector: 'app-example-compact',
  standalone: true,
  imports: [DigitFlowComponent],
  template: `
    <div class="ex-card">
      <div class="ex-card__label">Compact Notation</div>
      <ngx-digit-flow
        [value]="compact()"
        [format]="fmt"
        class="ex-number ex-number--lg"
      />
      <div class="ex-card__sub">{{ compact().toLocaleString() }} raw</div>
    </div>
  `,
})
export class ExCompactComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private index = signal(0);
  private values = [1200, 15400, 2100000, 150000000];
  compact = computed(() => this.values[this.index()]);
  fmt: Intl.NumberFormatOptions = { notation: 'compact', maximumFractionDigits: 1 };
  private t?: ReturnType<typeof setInterval>;
  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.t = setInterval(() => {
        this.index.update(i => (i + 1) % this.values.length);
      }, 1800);
    }
  }
  ngOnDestroy() { clearInterval(this.t); }
}

// ── Root Examples Component ───────────────────────────────────────────────────
@Component({
  selector: 'app-examples',
  standalone: true,
  imports: [
    ExRevenueComponent,
    ExScoreComponent,
    ExCountdownComponent,
    ExPercentComponent,
    ExCompactComponent,
  ],
  template: `
    <section class="examples" id="examples">
      <div class="examples__header">
        <div class="section-tag">Examples</div>
        <h2 class="section-title">Every number, animated</h2>
        <p class="section-sub">
          Works with any <code>Intl.NumberFormat</code> option — currency, percent,
          compact, units, and more.
        </p>
      </div>
      <div class="examples__grid">
        <app-example-revenue />
        <app-example-score />
        <app-example-countdown />
        <app-example-percent />
        <app-example-compact />
      </div>
    </section>
  `,
  styleUrl: './examples.component.scss',
})
export class ExamplesComponent {}
