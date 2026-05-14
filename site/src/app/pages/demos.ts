import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DigitFlowComponent } from 'ngx-digit-flow';

@Component({
  selector: 'app-demos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DigitFlowComponent],
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
          <div class="score-head">
            <span class="card-label">Score</span>
            <span class="score-best">Best&nbsp;<strong>{{ scoreBest() }}</strong></span>
          </div>
          <div class="score-stage">
            <div class="score-number" [class.trend-up]="scoreTrend() === 'up'" [class.trend-down]="scoreTrend() === 'down'">
              <ngx-digit-flow [value]="score()" [duration]="400" />
            </div>
            @if (scoreDelta() !== 0) {
              <span class="score-delta" [class.pos]="scoreDelta() > 0" [class.neg]="scoreDelta() < 0">
                {{ scoreDelta() > 0 ? '+' + scoreDelta() : scoreDelta() }}
              </span>
            }
          </div>
          <div class="score-btns">
            <button class="score-btn score-btn--dec" (click)="changeScore(-1)">−</button>
            <button class="score-btn score-btn--inc" (click)="changeScore(1)">+</button>
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
          <div class="progress-head">
            <span class="card-label">Progress</span>
            <button class="progress-play-btn" (click)="progressPaused.update(v => !v)" [attr.aria-label]="progressPaused() ? 'Play' : 'Pause'">
              @if (progressPaused()) {
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M3 2l7 4-7 4V2z"/></svg>
              } @else {
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="2" width="3" height="8" rx="1"/><rect x="7" y="2" width="3" height="8" rx="1"/></svg>
              }
            </button>
          </div>

          <div class="progress-stage">
            @if (progressStyle() === 'linear') {
              <div class="progress-pct">
                <ngx-digit-flow [value]="progress()" [format]="progressFmt" [duration]="220" />
              </div>
              <div class="progress-bar-track">
                <div class="progress-bar-fill" [style.width.%]="progress() * 100"></div>
              </div>
            } @else if (progressStyle() === 'steps') {
              <div class="progress-pct">
                <ngx-digit-flow [value]="progress()" [format]="progressFmt" [duration]="220" />
              </div>
              <div class="progress-segs">
                @for (filled of progressSegments(); track $index) {
                  <div class="progress-seg" [class.filled]="filled"></div>
                }
              </div>
            } @else {
              <div class="progress-ring-wrap">
                <svg class="progress-ring" viewBox="0 0 72 72">
                  <circle class="ring-bg" cx="36" cy="36" r="28"/>
                  <circle class="ring-fill" cx="36" cy="36" r="28"
                    [style.stroke-dashoffset]="ringOffset()"
                  />
                </svg>
                <div class="progress-ring-label">
                  <ngx-digit-flow [value]="progress()" [format]="progressFmt" [duration]="220" />
                </div>
              </div>
            }
          </div>

          <div class="progress-style-tabs">
            <button [class.active]="progressStyle() === 'linear'"  (click)="progressStyle.set('linear')">Linear</button>
            <button [class.active]="progressStyle() === 'steps'"   (click)="progressStyle.set('steps')">Steps</button>
            <button [class.active]="progressStyle() === 'ring'"    (click)="progressStyle.set('ring')">Ring</button>
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
              step="1"
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
          <div class="pricing-body">
            <span class="pricing-tier-badge" [class]="'tier-' + pricingTierSlug()">
              {{ pricingTier() }}
            </span>
            <div class="pricing-amount">
              <ngx-digit-flow
                [value]="pricingVal()"
                [format]="pricingFmt"
                [duration]="700"
              />
            </div>
            <span class="pricing-cycle">per month</span>
          </div>
        </div>

        <!-- Temperature toggle -->
        <div class="card card--temp">
          <span class="card-label">Temperature</span>
          <div class="temp-display">
            <div class="temp-value" [style.color]="tempColor()">
              <ngx-digit-flow
                [value]="tempDisplay()"
                [format]="tempFmt"
                [suffix]="tempUnit()"
                [duration]="600"
              />
            </div>
            <span class="temp-condition" [style.color]="tempColor()">{{ tempCondition() }}</span>
          </div>
          <div class="temp-therm">
            <div class="temp-therm-track">
              <div class="temp-therm-dot" [style.left.%]="thermPct()"></div>
            </div>
            <div class="temp-therm-labels">
              <span>−10°</span>
              <span>45°</span>
            </div>
          </div>
          <div class="temp-btns">
            <button class="temp-btn" [class.active]="tempCelsius()" (click)="tempCelsius.set(true)">°C</button>
            <button class="temp-btn" [class.active]="!tempCelsius()" (click)="tempCelsius.set(false)">°F</button>
          </div>
        </div>

        <!-- Transfer -->
        <div class="card card--transfer">
          <div class="transfer-head">
            <span class="card-label">Transfer</span>
            <div class="transfer-tabs">
              @for (pair of transferPairs; track pair.code; let i = $index) {
                <button [class.active]="transferPairIdx() === i" (click)="setTransferPair(i)">
                  {{ pair.code }}
                </button>
              }
            </div>
          </div>
          <div class="transfer-sublabels">
            <span>You send</span>
            <span>You receive</span>
          </div>
          <div class="transfer-row">
            <div class="transfer-side">
              <span class="transfer-code">USD</span>
              <ngx-digit-flow class="transfer-val" [value]="transferAmount()" [format]="transferSendFmt" [duration]="250" />
            </div>
            <svg class="transfer-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            <div class="transfer-side transfer-side--recv">
              <span class="transfer-code">{{ transferPair().code }}</span>
              <ngx-digit-flow class="transfer-val transfer-val--recv" [value]="transferReceive()" [format]="transferFmt()" [duration]="400" />
            </div>
          </div>
          <input class="transfer-slider" type="range" min="100" max="5000" step="10"
            [value]="transferAmount()" (input)="onTransferChange($event)" />
          <div class="transfer-rate">
            <span class="transfer-rate-text">
              1 USD =&nbsp;<ngx-digit-flow class="transfer-rate-num" [value]="transferRate()" [format]="transferRateFmt()" [duration]="700" />&nbsp;{{ transferPair().code }}
            </span>
            <span class="transfer-live-badge">&#x21BB; live</span>
          </div>
        </div>

        <!-- Currency / locale -->
        <div class="card card--locale">
          <span class="card-label">Locale</span>
          <div class="locale-primary">
            <span class="locale-flag">{{ localeActive().flag }}</span>
            <ngx-digit-flow class="locale-primary-val"
              [value]="localeNum()"
              [format]="localeFmt()"
              [locales]="localeStr()"
              [duration]="700"
            />
          </div>
          <div class="locale-others">
            @for (opt of localeOthers(); track opt.locale) {
              <button class="locale-other-row" (click)="setLocale(opt)">
                <span class="locale-other-flag">{{ opt.flag }}</span>
                <span class="locale-other-code">{{ opt.label }}</span>
                <ngx-digit-flow class="locale-other-val"
                  [value]="localeNum()"
                  [format]="opt.localeFmt"
                  [locales]="opt.locale"
                  [duration]="700"
                />
                <svg class="locale-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            }
          </div>
        </div>

        <!-- Social counter -->
        <div class="card card--social">
          <span class="card-label">Social</span>
          <div class="social-post">
            <img class="social-avatar" src="https://profilio.ai/brand/profilio-logo-32.png" alt="avatar" />
            <p class="social-body">Numbers that feel alive. ngx-digit-flow makes every counter a micro-experience in Angular.</p>
          </div>
          <div class="social-stats">
            <button class="social-stat">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              <ngx-digit-flow [value]="socialComments()" [format]="compactFmt" [duration]="400" />
            </button>
            <button class="social-stat">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
              <ngx-digit-flow [value]="socialReposts()" [format]="compactFmt" [duration]="400" />
            </button>
            <button class="social-stat social-stat--heart" [class.liked]="socialLiked()" (click)="toggleLike()">
              <svg width="15" height="15" viewBox="0 0 24 24" [attr.fill]="socialLiked() ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              <ngx-digit-flow [value]="socialLikes()" [format]="compactFmt" [duration]="400" />
            </button>
            <button class="social-stat">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              <ngx-digit-flow [value]="socialViews()" [format]="compactFmt" [duration]="400" />
            </button>
          </div>
        </div>

        <!-- Cart -->
        <div class="card card--cart">
          <span class="card-label">Cart</span>
          <div class="cart-items">
            <div class="cart-item">
              <span class="cart-name">Pro Plan</span>
              <div class="cart-right">
                <div class="cart-qty-ctrl">
                  <button class="cart-qty-btn" (click)="cartQty1.update(v => v > 0 ? v - 1 : 0)">−</button>
                  <ngx-digit-flow class="cart-qty-num" [value]="cartQty1()" [duration]="200" />
                  <button class="cart-qty-btn" (click)="cartQty1.update(v => v + 1)">+</button>
                </div>
                <ngx-digit-flow class="cart-price" [value]="cartQty1() * 29.99" [format]="cartFmt" [duration]="350" />
              </div>
            </div>
            <div class="cart-item">
              <span class="cart-name">Add-on</span>
              <div class="cart-right">
                <div class="cart-qty-ctrl">
                  <button class="cart-qty-btn" (click)="cartQty2.update(v => v > 0 ? v - 1 : 0)">−</button>
                  <ngx-digit-flow class="cart-qty-num" [value]="cartQty2()" [duration]="200" />
                  <button class="cart-qty-btn" (click)="cartQty2.update(v => v + 1)">+</button>
                </div>
                <ngx-digit-flow class="cart-price" [value]="cartQty2() * 9.99" [format]="cartFmt" [duration]="350" />
              </div>
            </div>
          </div>
          <div class="cart-divider"></div>
          <div class="cart-total">
            <span class="cart-total-label">Total</span>
            <ngx-digit-flow class="cart-total-val" [value]="cartTotal()" [format]="cartFmt" [duration]="500" />
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
      grid-template-rows: 216px 216px 216px 216px 216px;
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
      gap: 0;
    }

    .score-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .score-best {
      font-size: 11px;
      color: var(--muted);
    }

    .score-best strong {
      font-family: var(--mono);
      font-weight: 700;
      color: oklch(46% 0.16 55);
    }

    .score-stage {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .score-number {
      font-size: 3rem;
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 1;
      transition: color 0.15s;
    }

    .score-number.trend-up   { color: oklch(42% 0.18 145); }
    .score-number.trend-down { color: oklch(44% 0.18 25);  }

    .score-delta {
      position: absolute;
      right: 4px;
      top: 50%;
      font-family: var(--mono);
      font-size: 13px;
      font-weight: 700;
      animation: scoreFloat 0.65s ease-out forwards;
      pointer-events: none;
    }

    .score-delta.pos { color: oklch(42% 0.18 145); }
    .score-delta.neg { color: oklch(44% 0.18 25);  }

    @keyframes scoreFloat {
      0%   { opacity: 1; transform: translateY(-50%); }
      100% { opacity: 0; transform: translateY(-140%); }
    }

    .score-btns {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .score-btn {
      flex: 1;
      height: 34px;
      border-radius: 100px;
      font-size: 20px;
      font-family: var(--font);
      line-height: 1;
      cursor: pointer;
      transition: all 0.12s;
      padding: 0;
    }

    .score-btn--dec {
      border: 1px solid oklch(88% 0.002 265);
      background: transparent;
      color: var(--muted);
    }
    .score-btn--dec:hover {
      border-color: oklch(44% 0.18 25);
      color: oklch(44% 0.18 25);
      background: oklch(97% 0.04 25);
    }

    .score-btn--inc {
      border: 1px solid oklch(52% 0.20 145);
      background: oklch(52% 0.20 145);
      color: #fff;
    }
    .score-btn--inc:hover {
      background: oklch(44% 0.20 145);
      border-color: oklch(44% 0.20 145);
    }

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
      gap: 0;
    }

    .progress-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      margin-bottom: 4px;
    }

    .progress-play-btn {
      width: 26px;
      height: 26px;
      border: 1px solid oklch(88% 0.002 265);
      border-radius: 50%;
      background: transparent;
      color: var(--ink);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.12s, border-color 0.12s;
      padding: 0;
    }
    .progress-play-btn:hover { background: oklch(95% 0.002 265); border-color: oklch(70% 0.003 265); }

    .progress-stage {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 10px;
    }

    .progress-pct {
      font-size: 2.6rem;
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 1;
    }

    /* ── Linear ── */
    .progress-bar-track {
      height: 8px;
      background: oklch(93% 0.003 265);
      border-radius: 100px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: 100px;
      background: linear-gradient(90deg, oklch(62% 0.22 255), oklch(50% 0.20 255));
      transition: width 0.22s linear;
      box-shadow: 0 0 6px oklch(56% 0.22 255 / 0.5);
    }

    /* ── Steps ── */
    .progress-segs {
      display: flex;
      gap: 3px;
      flex-shrink: 0;
    }

    .progress-seg {
      flex: 1;
      height: 8px;
      border-radius: 4px;
      background: oklch(93% 0.003 265);
      transition: background 0.15s, transform 0.15s;
    }

    .progress-seg.filled {
      background: oklch(56% 0.22 255);
      transform: scaleY(1.25);
    }

    /* ── Ring ── */
    .progress-ring-wrap {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
    }

    .progress-ring {
      width: 100%;
      max-width: 90px;
      height: auto;
      display: block;
    }

    .ring-bg {
      fill: none;
      stroke: oklch(93% 0.003 265);
      stroke-width: 6;
    }

    .ring-fill {
      fill: none;
      stroke: oklch(56% 0.22 255);
      stroke-width: 6;
      stroke-linecap: round;
      stroke-dasharray: 175.93;
      transform: rotate(-90deg);
      transform-origin: 36px 36px;
      transition: stroke-dashoffset 0.22s linear;
    }

    .progress-ring-label {
      position: absolute;
      font-size: 1.3rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    /* ── Style tabs ── */
    .progress-style-tabs {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
      background: oklch(94% 0.003 265);
      border-radius: 100px;
      padding: 3px;
    }

    .progress-style-tabs button {
      flex: 1;
      font-family: var(--font);
      font-size: 10px;
      font-weight: 500;
      padding: 4px 0;
      border: none;
      border-radius: 100px;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      transition: all 0.12s;
    }

    .progress-style-tabs button.active {
      background: #fff;
      color: var(--ink);
      box-shadow: 0 1px 3px oklch(0% 0 0 / 0.08);
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
      justify-content: space-between;
    }

    .pricing-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 8px;
    }

    .pricing-tier-badge {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.01em;
      padding: 3px 10px;
      border-radius: 100px;
      align-self: flex-start;
      flex-shrink: 0;
    }

    .tier-starter    { background: oklch(93% 0.07 145); color: oklch(38% 0.16 145); }
    .tier-pro        { background: oklch(93% 0.07 255); color: oklch(40% 0.18 255); }
    .tier-business   { background: oklch(93% 0.07 300); color: oklch(40% 0.18 300); }
    .tier-enterprise { background: oklch(93% 0.09 55);  color: oklch(40% 0.18 55);  }

    .pricing-amount {
      font-size: 2.6rem;
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 1;
    }

    .pricing-cycle {
      font-size: 11px;
      color: oklch(62% 0.003 265);
      flex-shrink: 0;
    }

    /* ── Temperature: col 4, row 3 ───────────── */
    .card--temp {
      grid-column: 4 / 5;
      grid-row: 3 / 4;
      gap: 0;
    }

    .temp-display {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4px;
    }

    .temp-value {
      font-size: 2.8rem;
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 1;
      transition: color 0.5s ease;
    }

    .temp-condition {
      font-size: 11px;
      font-weight: 500;
      transition: color 0.5s ease;
    }

    .temp-therm {
      flex-shrink: 0;
      margin-bottom: 10px;
    }

    .temp-therm-track {
      height: 5px;
      border-radius: 100px;
      background: linear-gradient(90deg,
        oklch(58% 0.22 255),
        oklch(58% 0.18 210),
        oklch(56% 0.18 150),
        oklch(60% 0.22 75),
        oklch(58% 0.24 35),
        oklch(54% 0.24 25));
      position: relative;
    }

    .temp-therm-dot {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 13px;
      height: 13px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 4px oklch(0% 0 0 / 0.18), 0 0 0 1.5px oklch(0% 0 0 / 0.07);
      transition: left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .temp-therm-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 5px;
      font-size: 10px;
      color: oklch(68% 0.003 265);
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

    /* ── Transfer: col 1–2, row 4 ───────────── */
    .card--transfer {
      grid-column: 1 / 3;
      grid-row: 4 / 5;
      gap: 0;
    }

    .transfer-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      margin-bottom: 10px;
    }

    .transfer-tabs {
      display: flex;
      gap: 4px;
    }

    .transfer-tabs button {
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

    .transfer-tabs button:hover { color: var(--ink); border-color: oklch(70% 0.003 265); }
    .transfer-tabs button.active {
      background: oklch(56% 0.22 255);
      color: #fff;
      border-color: oklch(56% 0.22 255);
    }

    .transfer-sublabels {
      display: flex;
      justify-content: space-between;
      flex-shrink: 0;
      font-size: 11px;
      color: oklch(62% 0.003 265);
      margin-bottom: 4px;
    }

    .transfer-row {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .transfer-side {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .transfer-side--recv { align-items: flex-end; }

    .transfer-code {
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 600;
      color: oklch(55% 0.005 265);
      letter-spacing: 0.04em;
    }

    .transfer-val {
      font-size: 2.4rem;
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 1;
    }

    .transfer-val--recv { color: oklch(44% 0.20 255); }

    .transfer-arrow {
      color: oklch(78% 0.003 265);
      flex-shrink: 0;
    }

    .transfer-slider {
      width: 100%;
      -webkit-appearance: none;
      appearance: none;
      height: 3px;
      background: oklch(91% 0.002 265);
      border-radius: 100px;
      outline: none;
      cursor: pointer;
      display: block;
      accent-color: oklch(56% 0.22 255);
      flex-shrink: 0;
      margin: 4px 0 10px;
    }
    .transfer-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #fff;
      border: none;
      cursor: pointer;
      box-shadow: 0 1px 3px oklch(0% 0 0 / 0.15), 0 0 0 1px oklch(88% 0.002 265);
    }
    .transfer-slider::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #fff;
      border: none;
      cursor: pointer;
      box-shadow: 0 1px 3px oklch(0% 0 0 / 0.15), 0 0 0 1px oklch(88% 0.002 265);
    }

    .transfer-rate {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .transfer-rate-text {
      font-size: 11.5px;
      color: oklch(58% 0.004 265);
      display: inline-flex;
      align-items: center;
    }

    .transfer-rate-num {
      font-family: var(--mono);
      font-size: 11.5px;
      font-weight: 600;
      color: var(--ink);
    }

    .transfer-live-badge {
      font-size: 10px;
      font-weight: 600;
      color: oklch(44% 0.20 145);
      background: oklch(93% 0.07 145);
      padding: 2px 8px;
      border-radius: 100px;
    }

    /* ── Locale: col 3–4, row 4 ──────────────── */
    .card--locale {
      grid-column: 3 / 5;
      grid-row: 4 / 5;
      gap: 0;
    }

    .locale-primary {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .locale-flag {
      font-size: 22px;
      line-height: 1;
      flex-shrink: 0;
    }

    .locale-primary-val {
      font-size: 2.4rem;
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 1;
    }

    .locale-others {
      flex-shrink: 0;
      border-top: 1px solid oklch(93% 0.002 265);
      padding-top: 6px;
      display: flex;
      flex-direction: column;
      gap: 0;
      margin: 0 -22px;
      padding-left: 22px;
      padding-right: 22px;
    }

    .locale-other-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 10px;
      border-radius: 10px;
      background: transparent;
      border: none;
      font-family: var(--font);
      cursor: pointer;
      transition: background 0.12s;
      width: 100%;
      text-align: left;
      margin: 0 -10px;
      width: calc(100% + 20px);
    }

    .locale-other-row:hover { background: oklch(96% 0.003 265); }

    .locale-other-flag { font-size: 16px; line-height: 1; flex-shrink: 0; }

    .locale-other-code {
      font-size: 11px;
      font-weight: 600;
      color: oklch(58% 0.005 265);
      min-width: 28px;
      letter-spacing: 0.02em;
    }

    .locale-other-val {
      font-size: 13.5px;
      font-weight: 500;
      color: var(--ink);
      flex: 1;
    }

    .locale-chevron {
      color: oklch(75% 0.003 265);
      flex-shrink: 0;
    }

    /* ── Social: col 1–2, row 5 ────────────── */
    .card--social {
      grid-column: 1 / 3;
      grid-row: 5 / 6;
    }

    .social-post {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      margin-top: 10px;
    }

    .social-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      flex-shrink: 0;
      object-fit: cover;
    }

    .social-body {
      font-size: 12.5px;
      line-height: 1.5;
      color: var(--ink);
      margin: 0;
    }

    .social-stats {
      display: flex;
      flex-shrink: 0;
      border-top: 1px solid oklch(94% 0.002 265);
      margin: 0 -22px;
      padding: 0 22px;
    }

    .social-stat {
      flex: 1;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: oklch(55% 0.005 265);
      padding: 10px 0;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: color 0.15s;
      font-family: var(--font);
    }

    .social-stat:hover { color: var(--ink); }
    .social-stat--heart:hover { color: oklch(55% 0.20 10); }
    .social-stat--heart.liked { color: oklch(55% 0.20 10); }

    /* ── Cart: col 3–4, row 5 ────────────── */
    .card--cart {
      grid-column: 3 / 5;
      grid-row: 5 / 6;
    }

    .cart-items {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 4px;
    }

    .cart-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .cart-name {
      font-size: 13px;
      color: var(--ink);
      flex: 1;
    }

    .cart-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .cart-qty-ctrl {
      display: flex;
      align-items: center;
      gap: 2px;
      border: 1px solid oklch(88% 0.002 265);
      border-radius: 100px;
      padding: 2px 6px;
    }

    .cart-qty-btn {
      width: 22px;
      height: 22px;
      border: none;
      background: transparent;
      font-size: 16px;
      line-height: 1;
      color: var(--ink);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.12s;
      padding: 0;
      font-family: var(--font);
    }
    .cart-qty-btn:hover { background: oklch(94% 0.002 265); }

    .cart-qty-num {
      font-family: var(--mono);
      font-size: 12px;
      font-weight: 600;
      min-width: 18px;
      text-align: center;
      color: var(--ink);
      display: inline-flex;
      justify-content: center;
    }

    .cart-price {
      font-size: 13px;
      font-weight: 500;
      min-width: 56px;
      text-align: right;
      color: oklch(45% 0.003 265);
    }

    .cart-divider {
      height: 1px;
      background: oklch(92% 0.002 265);
      flex-shrink: 0;
      margin: auto 0 8px;
    }

    .cart-total {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .cart-total-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--ink);
    }

    .cart-total-val {
      font-size: 1.8rem;
      font-weight: 700;
      letter-spacing: -0.03em;
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
      .card--transfer  { grid-column: 1 / 3; grid-row: 6 / 7; }
      .card--locale    { grid-column: 1 / 3; grid-row: 7 / 8; }
      .card--social    { grid-column: 1 / 3; grid-row: 8 / 9; }
      .card--cart      { grid-column: 1 / 3; grid-row: 9 / 10; }
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
      .card--transfer,
      .card--locale,
      .card--social,
      .card--cart { grid-column: 1 / 2; grid-row: auto; }
    }
  `],
})
export class DemosComponent implements OnInit {
  protected countdown  = signal(30);
  protected score      = signal(0);
  protected scoreBest  = signal(0);
  protected scoreTrend = signal<'up' | 'down' | 'neutral'>('neutral');
  protected scoreDelta = signal(0);
  private   scoreTrendTimer: ReturnType<typeof setTimeout> | null = null;

  protected compact = signal(1200);
  protected compactFmt: Intl.NumberFormatOptions = {
    notation: 'compact',
    maximumFractionDigits: 1,
  } as Intl.NumberFormatOptions;
  private compactValues = [1200, 15_400, 2_100_000, 150_000_000];
  private compactIdx = 0;

  protected progress       = signal(0);
  protected progressPaused = signal(false);
  protected progressStyle  = signal<'linear' | 'steps' | 'ring'>('linear');
  protected progressFmt: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 0 };

  protected progressSegments = computed(() =>
    Array.from({ length: 10 }, (_, i) => this.progress() >= (i + 0.5) / 10)
  );

  protected readonly ringCircumference = 2 * Math.PI * 28;
  protected ringOffset = computed(() => this.ringCircumference * (1 - this.progress()));

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
  protected pricingVal      = signal(this.pricingTiers[0].price);
  protected pricingTier     = signal(this.pricingTiers[0].label);
  protected pricingTierSlug = computed(() => this.pricingTier().toLowerCase());
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
  protected tempUnit      = computed(() => this.tempCelsius() ? ' °C' : ' °F');
  protected tempColor     = computed(() => {
    const c = this.tempC();
    if (c < 5)  return 'oklch(52% 0.20 255)';
    if (c < 15) return 'oklch(50% 0.18 210)';
    if (c < 25) return 'oklch(46% 0.16 150)';
    if (c < 32) return 'oklch(52% 0.22 55)';
    return              'oklch(48% 0.24 25)';
  });
  protected tempCondition = computed(() => {
    const c = this.tempC();
    if (c < 0)  return 'Freezing';
    if (c < 10) return 'Cold';
    if (c < 18) return 'Cool';
    if (c < 25) return 'Comfortable';
    if (c < 32) return 'Warm';
    return              'Hot';
  });
  protected thermPct = computed(() => {
    const MIN = -10, MAX = 45;
    return Math.min(100, Math.max(0, (this.tempC() - MIN) / (MAX - MIN) * 100));
  });

  // Transfer card
  protected readonly transferPairs = [
    { code: 'EUR', baseRate: 0.9245, fmt: { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 } as Intl.NumberFormatOptions },
    { code: 'GBP', baseRate: 0.7892, fmt: { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 } as Intl.NumberFormatOptions },
    { code: 'JPY', baseRate: 149.85, fmt: { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 } as Intl.NumberFormatOptions },
  ];
  protected transferPairIdx  = signal(0);
  protected transferAmount   = signal(1000);
  protected transferRate     = signal(0.9245);
  protected transferPair     = computed(() => this.transferPairs[this.transferPairIdx()]);
  protected transferFmt      = computed(() => this.transferPairs[this.transferPairIdx()].fmt);
  protected transferRateFmt  = computed((): Intl.NumberFormatOptions =>
    this.transferPairs[this.transferPairIdx()].code === 'JPY'
      ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : { minimumFractionDigits: 4, maximumFractionDigits: 4 }
  );
  protected transferReceive  = computed(() => {
    const isJpy = this.transferPairs[this.transferPairIdx()].code === 'JPY';
    const raw = this.transferAmount() * this.transferRate();
    return isJpy ? Math.round(raw) : parseFloat(raw.toFixed(2));
  });
  protected transferSendFmt: Intl.NumberFormatOptions = {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  };

  protected localeOptions = [
    { label: 'USD', locale: 'en-US', currency: 'USD', flag: '🇺🇸', localeFmt: { style: 'currency', currency: 'USD' } as Intl.NumberFormatOptions },
    { label: 'EUR', locale: 'de-DE', currency: 'EUR', flag: '🇩🇪', localeFmt: { style: 'currency', currency: 'EUR' } as Intl.NumberFormatOptions },
    { label: 'JPY', locale: 'ja-JP', currency: 'JPY', flag: '🇯🇵', localeFmt: { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 } as Intl.NumberFormatOptions },
  ];
  protected localeStr    = signal('en-US');
  protected localeFmt    = computed(() => this.localeOptions.find(o => o.locale === this.localeStr())!.localeFmt);
  protected localeActive = computed(() => this.localeOptions.find(o => o.locale === this.localeStr())!);
  protected localeOthers = computed(() => this.localeOptions.filter(o => o.locale !== this.localeStr()));
  protected localeNum    = signal(1_234_567.89);

  // Social counter
  protected socialComments = signal(40);
  protected socialReposts  = signal(2_100);
  protected socialLikes    = signal(21_000);
  protected socialViews    = signal(429_000);
  protected socialLiked    = signal(false);

  // Cart
  protected cartQty1  = signal(1);
  protected cartQty2  = signal(2);
  protected cartFmt: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD', minimumFractionDigits: 2 };
  protected cartTotal = computed(() =>
    parseFloat((this.cartQty1() * 29.99 + this.cartQty2() * 9.99).toFixed(2))
  );

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
      if (!this.progressPaused()) {
        this.progress.update(v => v >= 1 ? 0 : parseFloat((v + 0.025).toFixed(3)));
      }
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

    // Social counter live increments
    ids.push(setInterval(() => {
      this.socialLikes.update(v => v + Math.floor(Math.random() * 12 + 4));
      this.socialViews.update(v => v + Math.floor(Math.random() * 300 + 80));
    }, 1200));
    ids.push(setInterval(() => {
      this.socialReposts.update(v => v + Math.floor(Math.random() * 3 + 1));
    }, 3500));
    ids.push(setInterval(() => {
      this.socialComments.update(v => v + 1);
    }, 6000));

    // Locale number live drift
    ids.push(setInterval(() => {
      this.localeNum.update(v => parseFloat((v + Math.random() * 400 - 80).toFixed(2)));
    }, 2800));

    // Transfer rate live oscillation
    let transferPhase = 0;
    ids.push(setInterval(() => {
      const pair = this.transferPairs[this.transferPairIdx()];
      transferPhase += 0.1;
      const base = pair.baseRate;
      const jpy  = pair.code === 'JPY';
      const rate  = jpy
        ? parseFloat((base + Math.sin(transferPhase) * base * 0.003).toFixed(2))
        : parseFloat((base + Math.sin(transferPhase) * base * 0.003).toFixed(4));
      this.transferRate.set(rate);
    }, 1100));

    this.destroyRef.onDestroy(() => {
      ids.forEach(id => clearInterval(id));
      if (this.scoreTrendTimer) clearTimeout(this.scoreTrendTimer);
    });
  }

  protected changeScore(delta: number): void {
    this.score.update(v => v + delta);
    this.scoreBest.update(v => Math.max(v, this.score()));
    this.scoreTrend.set(delta > 0 ? 'up' : 'down');
    this.scoreDelta.set(0);
    setTimeout(() => this.scoreDelta.set(delta));
    if (this.scoreTrendTimer) clearTimeout(this.scoreTrendTimer);
    this.scoreTrendTimer = setTimeout(() => {
      this.scoreTrend.set('neutral');
      this.scoreDelta.set(0);
      this.scoreTrendTimer = null;
    }, 650);
  }

  protected setTransferPair(idx: number): void {
    this.transferPairIdx.set(idx);
    this.transferRate.set(this.transferPairs[idx].baseRate);
  }

  protected onTransferChange(event: Event): void {
    this.transferAmount.set(+(event.target as HTMLInputElement).value);
  }

  protected setLocale(opt: { locale: string }): void {
    this.localeStr.set(opt.locale);
  }

  protected onSliderChange(event: Event): void {
    this.sliderVal.set(+(event.target as HTMLInputElement).value);
  }

  protected toggleLike(): void {
    const liked = !this.socialLiked();
    this.socialLiked.set(liked);
    this.socialLikes.update(v => liked ? v + 1 : v - 1);
  }
}
