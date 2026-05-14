import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DigitFlowComponent, DigitFlowGroupDirective } from 'ngx-digit-flow';

/* ── Demo card with Preview / Code tabs ───────────────────────────── */
@Component({
  selector: 'docs-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ddemo">
      <div class="ddemo-head">
        <span class="ddemo-label">{{ label() }}</span>
        <div class="ddemo-head-right">
          @if (tab() === 'code') {
            <button class="copy-btn" (click)="copy()">
              {{ copied() ? 'Copied!' : 'Copy' }}
            </button>
          }
          <div class="ddemo-tabs" role="tablist">
            <button role="tab" [class.active]="tab() === 'preview'" (click)="tab.set('preview')">
              Preview
            </button>
            <button role="tab" [class.active]="tab() === 'code'" (click)="tab.set('code')">
              Code
            </button>
          </div>
        </div>
      </div>

      @if (tab() === 'preview') {
        <div class="ddemo-preview">
          <ng-content select="[slot='number']" />
        </div>
        <div class="ddemo-controls">
          <ng-content select="[slot='controls']" />
        </div>
      } @else {
        <pre class="ddemo-code"><code>{{ code() }}</code></pre>
      }
    </div>
  `,
  styles: [
    `
      .ddemo {
        border: 1px solid oklch(91% 0.005 265);
        border-radius: 14px;
        overflow: hidden;
        margin-bottom: 20px;
        background: oklch(99.5% 0.002 265);
      }

      .ddemo-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 11px 16px;
        border-bottom: 1px solid oklch(93% 0.004 265);
        background: oklch(98.5% 0.003 265);
      }

      .ddemo-label {
        font-family: var(--mono);
        font-size: 11px;
        font-weight: 500;
        color: var(--dim);
      }

      .ddemo-head-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .copy-btn {
        font-family: var(--mono);
        font-size: 11px;
        padding: 3px 10px;
        border: 1px solid oklch(88% 0.005 265);
        border-radius: 100px;
        background: transparent;
        color: var(--muted);
        cursor: pointer;
        transition: all 0.12s;
      }
      .copy-btn:hover {
        color: var(--ink);
        border-color: oklch(70% 0.005 265);
      }

      .ddemo-tabs {
        display: flex;
        gap: 2px;
        background: oklch(93% 0.004 265);
        border-radius: 100px;
        padding: 3px;
      }

      .ddemo-tabs button {
        font-family: var(--mono);
        font-size: 11px;
        padding: 4px 10px;
        border: none;
        border-radius: 100px;
        background: transparent;
        color: var(--muted);
        cursor: pointer;
        transition: all 0.12s;
      }

      .ddemo-tabs button.active {
        background: oklch(99.5% 0.002 265);
        color: var(--ink);
        box-shadow: 0 1px 3px oklch(0% 0 0 / 0.08);
      }

      /* Preview: tall centered stage for the number */
      .ddemo-preview {
        padding: 40px 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 120px;
      }

      /* Controls: compact row below, separated by a hairline */
      .ddemo-controls {
        border-top: 1px solid oklch(93% 0.004 265);
        padding: 14px 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex-wrap: wrap;
        background: oklch(98.8% 0.002 265);
      }

      .ddemo-code {
        margin: 0;
        padding: 20px 24px;
        font-family: var(--mono);
        font-size: 13px;
        line-height: 1.65;
        color: var(--ink);
        overflow-x: auto;
        white-space: pre;
      }
    `,
  ],
})
export class DocsDemoComponent {
  label = input.required<string>();
  code = input.required<string>();
  tab = signal<'preview' | 'code'>('preview');
  copied = signal(false);

  private doc = inject(DOCUMENT);

  copy(): void {
    this.doc.defaultView?.navigator.clipboard
      .writeText(this.code())
      .then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 1800);
      })
      .catch(() => {});
  }
}

/* ── Docs page ────────────────────────────────────────────────────── */
@Component({
  selector: 'app-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DigitFlowComponent, DigitFlowGroupDirective, DocsDemoComponent],
  template: `
    <div class="docs-page">
      <nav class="docs-sidebar">
        <p class="sidebar-title">On this page</p>
        <ul class="sidebar-nav">
          @for (item of navItems; track item.id) {
            <li>
              <a
                class="sidebar-link"
                [class.active]="activeSection() === item.id"
                [href]="'#' + item.id"
                (click)="navTo(item.id, $event)"
                >{{ item.label }}</a
              >
            </li>
          }
        </ul>
      </nav>

      <div class="docs-content">
        <h1 class="docs-title">Documentation</h1>

        <!-- Installation -->
        <section class="docs-section" id="installation" data-section="installation">
          <h2 class="section-heading">Installation</h2>
          <pre class="code-block"><code>npm install ngx-digit-flow</code></pre>

          <h3 class="sub-heading">Import</h3>
          <pre class="code-block">{{ codeImport }}</pre>
        </section>

        <!-- Basic usage -->
        <section class="docs-section" id="basic-usage" data-section="basic-usage">
          <h2 class="section-heading">Basic Usage</h2>

          <docs-demo label="Basic" [code]="codeBasic">
            <div slot="number" class="demo-number-wrap">
              <ngx-digit-flow [value]="basicVal()" [duration]="900" />
            </div>
            <div slot="controls">
              <button class="demo-btn" (click)="basicVal.set(0)">0</button>
              <button class="demo-btn" (click)="basicVal.set(42)">42</button>
              <button class="demo-btn" (click)="basicVal.set(1337)">1337</button>
              <button class="demo-btn" (click)="basicVal.set(9999)">9999</button>
            </div>
          </docs-demo>
        </section>

        <!-- Format options -->
        <section class="docs-section" id="format-options" data-section="format-options">
          <h2 class="section-heading">Format Options</h2>
          <p class="section-desc">
            Pass any <code>Intl.NumberFormatOptions</code> to <code>[format]</code>. Digits animate
            individually — currency symbols and separators FLIP into position.
          </p>

          <docs-demo label="Currency" [code]="codeCurrency">
            <div slot="number" class="demo-number-wrap">
              <ngx-digit-flow [value]="currencyVal()" [format]="currencyFmt" [duration]="900" />
            </div>
            <div slot="controls">
              <button class="demo-btn" (click)="currencyVal.set(0)">$0</button>
              <button class="demo-btn" (click)="currencyVal.set(1234.56)">$1,234.56</button>
              <button class="demo-btn" (click)="currencyVal.set(1000000)">$1M</button>
            </div>
          </docs-demo>

          <docs-demo label="Percent" [code]="codePercent">
            <div slot="number" class="demo-number-wrap">
              <ngx-digit-flow [value]="pctVal()" [format]="pctFmt" [duration]="600" />
            </div>
            <div slot="controls">
              <button class="demo-btn" (click)="pctVal.set(0)">0%</button>
              <button class="demo-btn" (click)="pctVal.set(0.5)">50%</button>
              <button class="demo-btn" (click)="pctVal.set(0.999)">99.9%</button>
            </div>
          </docs-demo>

          <docs-demo label="Compact notation" [code]="codeCompact">
            <div slot="number" class="demo-number-wrap">
              <ngx-digit-flow [value]="compactVal()" [format]="compactFmt" [duration]="800" />
            </div>
            <div slot="controls">
              <button class="demo-btn" (click)="compactVal.set(999)">999</button>
              <button class="demo-btn" (click)="compactVal.set(15400)">15.4K</button>
              <button class="demo-btn" (click)="compactVal.set(2100000)">2.1M</button>
              <button class="demo-btn" (click)="compactVal.set(150000000)">150M</button>
            </div>
          </docs-demo>
        </section>

        <!-- Prefix & Suffix -->
        <section class="docs-section" id="prefix-suffix" data-section="prefix-suffix">
          <h2 class="section-heading">Prefix &amp; Suffix</h2>
          <p class="section-desc">
            Use <code>[prefix]</code> and <code>[suffix]</code> for custom text outside the
            formatted number. They animate in/out with the same fade transitions as separators.
          </p>

          <docs-demo label="Suffix — km/h" [code]="codePrefixSuffix">
            <div slot="number" class="demo-number-wrap">
              <ngx-digit-flow [value]="suffixVal()" [suffix]="' km/h'" [duration]="700" />
            </div>
            <div slot="controls">
              <button class="demo-btn" (click)="suffixVal.set(0)">0</button>
              <button class="demo-btn" (click)="suffixVal.set(60)">60</button>
              <button class="demo-btn" (click)="suffixVal.set(120)">120</button>
              <button class="demo-btn" (click)="suffixVal.set(299)">299</button>
            </div>
          </docs-demo>
        </section>

        <!-- Custom Duration -->
        <section class="docs-section" id="custom-duration" data-section="custom-duration">
          <h2 class="section-heading">Custom Duration</h2>
          <p class="section-desc">
            Control animation speed with <code>[duration]</code> (milliseconds).
            <code>[opacityDuration]</code> controls fade-in/out separately.
          </p>

          <docs-demo label="Duration comparison" [code]="codeDuration">
            <div slot="number" class="demo-dur-grid" ngxDigitFlowGroup>
              @for (d of durationDemos; track d.ms) {
                <div class="demo-dur-item">
                  <span class="demo-dur-label">{{ d.label }}</span>
                  <ngx-digit-flow [value]="durVal()" [duration]="d.ms" />
                </div>
              }
            </div>
            <div slot="controls">
              <button class="demo-btn" (click)="triggerDur()">Trigger ↻</button>
            </div>
          </docs-demo>
        </section>

        <!-- Animated toggle -->
        <section class="docs-section" id="animated-toggle" data-section="animated-toggle">
          <h2 class="section-heading">Animated Toggle</h2>
          <p class="section-desc">
            Set <code>[animated]="false"</code> to disable all animations — useful when the user
            prefers reduced motion or for server-side rendering snapshots. The component respects
            <code>prefers-reduced-motion</code> automatically.
          </p>

          <docs-demo label="[animated] toggle" [code]="codeAnimated">
            <div slot="number" class="demo-number-wrap">
              <ngx-digit-flow [value]="animVal()" [animated]="isAnimated()" [duration]="900" />
            </div>
            <div slot="controls">
              <button class="demo-btn" (click)="animVal.update((v) => v + 1)">+1</button>
              <button
                class="demo-btn"
                [class.active]="isAnimated()"
                (click)="isAnimated.update((v) => !v)"
              >
                animated: {{ isAnimated() }}
              </button>
            </div>
          </docs-demo>
        </section>

        <!-- Group directive -->
        <section class="docs-section" id="group-directive" data-section="group-directive">
          <h2 class="section-heading">Group Directive</h2>
          <p class="section-desc">
            Wrap multiple <code>ngx-digit-flow</code> instances in
            <code>[ngxDigitFlowGroup]</code> to declare that they form a logical unit (e.g.
            hours:minutes:seconds). Angular schedules their renders together.
          </p>

          <docs-demo label="ngxDigitFlowGroup — clock" [code]="codeGroup">
            <div slot="number" class="demo-clock" ngxDigitFlowGroup>
              <ngx-digit-flow [value]="clockH()" [duration]="700" />
              <span class="clock-sep">:</span>
              <ngx-digit-flow [value]="clockM()" [duration]="700" />
              <span class="clock-sep">:</span>
              <ngx-digit-flow [value]="clockS()" [duration]="700" />
            </div>
          </docs-demo>
        </section>

        <!-- Outputs -->
        <section class="docs-section" id="outputs" data-section="outputs">
          <h2 class="section-heading">Outputs</h2>
          <p class="section-desc">
            <code>(animationsStart)</code> fires when any animation begins.
            <code>(animationsFinish)</code> fires when all running animations complete. Both are
            debounced across rapid value changes.
          </p>

          <docs-demo label="(animationsFinish)" [code]="codeOutputs">
            <div slot="number" class="demo-output-wrap">
              <ngx-digit-flow
                [value]="outputVal()"
                [duration]="900"
                (animationsStart)="onStart()"
                (animationsFinish)="onFinish()"
              />
              <div class="output-log">
                @for (entry of outputLog().slice(-4); track $index) {
                  <span class="output-entry">{{ entry }}</span>
                }
              </div>
            </div>
            <div slot="controls">
              <button class="demo-btn" (click)="outputVal.set(0)">0</button>
              <button class="demo-btn" (click)="outputVal.set(1234)">1234</button>
              <button class="demo-btn" (click)="outputVal.set(99)">99</button>
            </div>
          </docs-demo>
        </section>

        <!-- Easing -->
        <section class="docs-section" id="easing" data-section="easing">
          <h2 class="section-heading">Easing</h2>
          <p class="section-desc">
            <code>[spinEasing]</code> controls the CSS easing of the vertical digit scroll.
            <code>[flipEasing]</code> controls the horizontal slide when digits appear or disappear
            (e.g. 9→10 or $999→$1,000). Use <code>overshoot</code> for a snappier feel, or pass any
            valid CSS easing string.
          </p>

          <docs-demo label="spinEasing" [code]="codeSpinEasing">
            <div slot="number" class="demo-dur-grid" ngxDigitFlowGroup>
              <div class="demo-dur-item">
                <span class="demo-dur-label">spring (default)</span>
                <ngx-digit-flow [value]="easingVal()" [duration]="900" [format]="currencyFmt" />
              </div>
              <div class="demo-dur-item">
                <span class="demo-dur-label">overshoot spring</span>
                <ngx-digit-flow
                  [value]="easingVal()"
                  [duration]="600"
                  [format]="currencyFmt"
                  spinEasing="overshoot"
                />
              </div>
              <div class="demo-dur-item">
                <span class="demo-dur-label">linear</span>
                <ngx-digit-flow
                  [value]="easingVal()"
                  [duration]="600"
                  [format]="currencyFmt"
                  spinEasing="linear"
                />
              </div>
            </div>
            <div slot="controls">
              <button class="demo-btn" (click)="triggerEasing()">Trigger ↻</button>
            </div>
          </docs-demo>

          <docs-demo
            label="flipEasing — layout shift on digit count change"
            [code]="codeFlipEasing"
          >
            <div slot="number" class="demo-dur-grid" ngxDigitFlowGroup>
              <div class="demo-dur-item">
                <span class="demo-dur-label">spring (default)</span>
                <ngx-digit-flow [value]="flipVal()" [duration]="900" [format]="currencyFmt" />
              </div>
              <div class="demo-dur-item">
                <span class="demo-dur-label">overshoot spring</span>
                <ngx-digit-flow
                  [value]="flipVal()"
                  [duration]="900"
                  [format]="currencyFmt"
                  flipEasing="overshoot"
                />
              </div>
            </div>
            <div slot="controls">
              <button class="demo-btn" (click)="flipVal.set(9)">$9</button>
              <button class="demo-btn" (click)="flipVal.set(99)">$99</button>
              <button class="demo-btn" (click)="flipVal.set(999)">$999</button>
              <button class="demo-btn" (click)="flipVal.set(1000)">$1,000</button>
              <button class="demo-btn" (click)="flipVal.set(9999)">$9,999</button>
            </div>
          </docs-demo>
        </section>

        <!-- Trend -->
        <section class="docs-section" id="trend" data-section="trend">
          <h2 class="section-heading">Trend</h2>
          <p class="section-desc">
            <code>trend</code> controls the path digits take around the reel, not whether the value
            increases or decreases. By default reels follow the value delta. Use
            <code>[trend]="1"</code> to always count up through the reel sequence, or
            <code>[trend]="-1"</code> to always count down through it.
          </p>

          <docs-demo label="trend" [code]="codeTrend">
            <div slot="number" class="demo-number-wrap">
              <ngx-digit-flow [value]="trendVal()" [duration]="900" [trend]="trendMode()" />
            </div>
            <div slot="controls">
              <span class="demo-control-label">value</span>
              <button class="demo-btn" (click)="trendVal.update((v) => v - 7)">− 7</button>
              <button class="demo-btn" (click)="trendVal.update((v) => v + 7)">+ 7</button>
              <span class="demo-control-separator" aria-hidden="true"></span>
              <span class="demo-control-label">digit path</span>
              <button
                class="demo-btn"
                [class.active]="trendMode() === undefined"
                (click)="trendMode.set(undefined)"
              >
                auto
              </button>
              <button
                class="demo-btn"
                [class.active]="trendMode() === 1"
                (click)="trendMode.set(1)"
              >
                count up
              </button>
              <button
                class="demo-btn"
                [class.active]="trendMode() === -1"
                (click)="trendMode.set(-1)"
              >
                count down
              </button>
            </div>
          </docs-demo>
        </section>

        <!-- Continuous -->
        <section class="docs-section" id="continuous" data-section="continuous">
          <h2 class="section-heading">Continuous Mode</h2>
          <p class="section-desc">
            <code>[continuous]="true"</code> keeps the update to one smooth animation, then loops
            unchanged lower-place digits so the reel visually ticks through intermediate values.
            Useful for score counters and live feeds where the lower digits should stay alive.
          </p>

          <docs-demo label="continuous" [code]="codeContinuous">
            <div slot="number" class="demo-dur-grid" ngxDigitFlowGroup>
              <div class="demo-dur-item">
                <span class="demo-dur-label">continuous: false</span>
                <ngx-digit-flow
                  [value]="contVal()"
                  [duration]="500"
                  [format]="{ maximumFractionDigits: 0 }"
                />
              </div>
              <div class="demo-dur-item">
                <span class="demo-dur-label">continuous: true</span>
                <ngx-digit-flow
                  [value]="contVal()"
                  [duration]="500"
                  [continuous]="true"
                  [format]="{ maximumFractionDigits: 0 }"
                />
              </div>
            </div>
            <div slot="controls">
              <button class="demo-btn" (click)="contVal.set(120)">120</button>
              <button class="demo-btn" (click)="contVal.set(140)">140</button>
              <button class="demo-btn" (click)="contVal.set(205)">205</button>
              <button class="demo-btn" (click)="contVal.set(300)">300</button>
            </div>
          </docs-demo>
        </section>

        <!-- Stagger -->
        <section class="docs-section" id="stagger" data-section="stagger">
          <h2 class="section-heading">Stagger</h2>
          <p class="section-desc">
            <code>[stagger]</code> delays newly entering and exiting digits or separators.
            Same-width value updates intentionally look the same because core digit spin and layout
            motion stay synchronized.
          </p>

          <docs-demo label="stagger" [code]="codeStagger">
            <div slot="number" class="demo-dur-grid" ngxDigitFlowGroup>
              <div class="demo-dur-item">
                <span class="demo-dur-label">stagger: 0</span>
                <ngx-digit-flow
                  [value]="staggerVal()"
                  [duration]="700"
                  [stagger]="0"
                  [format]="{ useGrouping: true }"
                />
              </div>
              <div class="demo-dur-item">
                <span class="demo-dur-label">stagger: 60 ms</span>
                <ngx-digit-flow
                  [value]="staggerVal()"
                  [duration]="700"
                  [stagger]="60"
                  [format]="{ useGrouping: true }"
                />
              </div>
            </div>
            <div slot="controls">
              <button class="demo-btn" (click)="triggerStagger()">Trigger ↻</button>
            </div>
          </docs-demo>
        </section>

        <!-- Color flash -->
        <section class="docs-section" id="color-flash" data-section="color-flash">
          <h2 class="section-heading">Color Flash</h2>
          <p class="section-desc">
            <code>[colorOnIncrease]</code> and <code>[colorOnDecrease]</code> flash a CSS color on
            the host element when the value changes direction, then fade back to the inherited
            color. Useful for stock tickers, scores, and live metrics.
          </p>

          <docs-demo label="colorOnIncrease / colorOnDecrease" [code]="codeColorFlash">
            <div slot="number" class="demo-number-wrap">
              <ngx-digit-flow
                [value]="colorVal()"
                [format]="currencyFmt"
                [duration]="600"
                colorOnIncrease="#4ade80"
                colorOnDecrease="#f87171"
              />
            </div>
            <div slot="controls">
              <button class="demo-btn" (click)="colorVal.update((v) => v - 50)">−50</button>
              <button class="demo-btn" (click)="colorVal.update((v) => v - 10)">−10</button>
              <button class="demo-btn" (click)="colorVal.update((v) => v + 10)">+10</button>
              <button class="demo-btn" (click)="colorVal.update((v) => v + 50)">+50</button>
            </div>
          </docs-demo>
        </section>

        <!-- API Reference -->
        <section class="docs-section" id="api-reference" data-section="api-reference">
          <h2 class="section-heading">API Reference</h2>

          <div class="api-group">
            <div class="api-group-label">
              <span class="api-component-name">DigitFlowComponent</span>
              <span class="api-kind-badge">Inputs</span>
            </div>
            <div class="table-wrap">
              <table class="api-table api-table--inputs">
                <thead>
                  <tr>
                    <th>Input</th>
                    <th>Type</th>
                    <th>Default</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Core -->
                  <tr class="api-group-row">
                    <td colspan="4"><span class="api-group-divider">Core</span></td>
                  </tr>
                  <tr>
                    <td><code>value</code></td>
                    <td><code>number</code></td>
                    <td><span class="badge-req">required</span></td>
                    <td>The number to display and animate.</td>
                  </tr>
                  <tr>
                    <td><code>format</code></td>
                    <td><code>Intl.NumberFormatOptions</code></td>
                    <td>
                      <code>{{ '{}' }}</code>
                    </td>
                    <td>Options forwarded to <code>Intl.NumberFormat</code>.</td>
                  </tr>
                  <tr>
                    <td><code>locales</code></td>
                    <td><code>string | string[]</code></td>
                    <td><code>undefined</code></td>
                    <td>BCP 47 locale(s) for formatting, including localized digit glyphs.</td>
                  </tr>
                  <tr>
                    <td><code>prefix</code></td>
                    <td><code>string</code></td>
                    <td><code>''</code></td>
                    <td>Static text prepended before the number.</td>
                  </tr>
                  <tr>
                    <td><code>suffix</code></td>
                    <td><code>string</code></td>
                    <td><code>''</code></td>
                    <td>Static text appended after the number.</td>
                  </tr>
                  <tr>
                    <td><code>animated</code></td>
                    <td><code>boolean</code></td>
                    <td><code>true</code></td>
                    <td>Enables or disables all animations.</td>
                  </tr>
                  <!-- Timing -->
                  <tr class="api-group-row">
                    <td colspan="4"><span class="api-group-divider">Timing</span></td>
                  </tr>
                  <tr>
                    <td><code>duration</code></td>
                    <td><code>number</code></td>
                    <td><code>900</code></td>
                    <td>Spin + FLIP animation duration in ms.</td>
                  </tr>
                  <tr>
                    <td><code>opacityDuration</code></td>
                    <td><code>number</code></td>
                    <td><code>450</code></td>
                    <td>Fade-in / fade-out duration for appearing and exiting elements.</td>
                  </tr>
                  <tr>
                    <td><code>transformTiming</code></td>
                    <td><code>DigitFlowTiming</code></td>
                    <td><code>duration+flipEasing</code></td>
                    <td>
                      Full WAAPI timing for the FLIP layout animation. Overrides
                      <code>duration</code> and <code>flipEasing</code>.
                    </td>
                  </tr>
                  <tr>
                    <td><code>spinTiming</code></td>
                    <td><code>DigitFlowTiming</code></td>
                    <td><code>transformTiming</code></td>
                    <td>Full WAAPI timing for digit spin animations.</td>
                  </tr>
                  <tr>
                    <td><code>opacityTiming</code></td>
                    <td><code>DigitFlowTiming</code></td>
                    <td><code>opacityDuration</code></td>
                    <td>Full WAAPI timing for fade-in and fade-out animations.</td>
                  </tr>
                  <!-- Animation style -->
                  <tr class="api-group-row">
                    <td colspan="4"><span class="api-group-divider">Animation style</span></td>
                  </tr>
                  <tr>
                    <td><code>spinEasing</code></td>
                    <td><code>DigitFlowEasing</code></td>
                    <td><code>spring</code></td>
                    <td>
                      CSS easing for the digit spin — each digit scrolls vertically on a 0–9 reel.
                      Accepts <code>spring</code>, <code>default</code>, <code>overshoot</code>, or
                      any CSS easing string.
                    </td>
                  </tr>
                  <tr>
                    <td><code>flipEasing</code></td>
                    <td><code>DigitFlowEasing</code></td>
                    <td><code>spring</code></td>
                    <td>
                      CSS easing for the FLIP animation — digits slide horizontally when the digit
                      count changes (e.g. 9→10). Accepts the same named presets and raw CSS easing
                      strings as <code>spinEasing</code>.
                    </td>
                  </tr>
                  <tr>
                    <td><code>trend</code></td>
                    <td><code>number | (oldValue, value) =&gt; number</code></td>
                    <td><code>auto</code></td>
                    <td>
                      Controls the path digits take around the reel. Use <code>1</code> to count up
                      through the reel sequence, <code>-1</code> to count down, <code>0</code> for
                      per-digit local direction, or a custom function.
                    </td>
                  </tr>
                  <!-- Features -->
                  <tr class="api-group-row">
                    <td colspan="4"><span class="api-group-divider">Features</span></td>
                  </tr>
                  <tr>
                    <td><code>continuous</code></td>
                    <td><code>boolean</code></td>
                    <td><code>false</code></td>
                    <td>
                      Ticker mode: visually ticks through intermediate values by looping unchanged
                      lower-place digits.
                    </td>
                  </tr>
                  <tr>
                    <td><code>digits</code></td>
                    <td>
                      <code>Record&lt;number, {{ '{' }} max?: number {{ '}' }}&gt;</code>
                    </td>
                    <td>
                      <code>{{ '{}' }}</code>
                    </td>
                    <td>
                      Configures digit reel ranges by decimal position, useful for clocks and
                      countdowns.
                    </td>
                  </tr>
                  <tr>
                    <td><code>respectMotionPreference</code></td>
                    <td><code>boolean</code></td>
                    <td><code>true</code></td>
                    <td>Disables animations when the user prefers reduced motion.</td>
                  </tr>
                  <tr>
                    <td><code>stagger</code></td>
                    <td><code>number</code></td>
                    <td><code>0</code></td>
                    <td>
                      Milliseconds of delay between entering/exiting presence animations. Core spin
                      and layout motion stay synchronized.
                    </td>
                  </tr>
                  <tr>
                    <td><code>colorOnIncrease</code></td>
                    <td><code>string</code></td>
                    <td><code>undefined</code></td>
                    <td>
                      CSS color flashed on the host when value increases (e.g.
                      <code>"#4ade80"</code>).
                    </td>
                  </tr>
                  <tr>
                    <td><code>colorOnDecrease</code></td>
                    <td><code>string</code></td>
                    <td><code>undefined</code></td>
                    <td>
                      CSS color flashed on the host when value decreases (e.g.
                      <code>"#f87171"</code>).
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="api-group">
            <div class="api-group-label">
              <span class="api-component-name">DigitFlowComponent</span>
              <span class="api-kind-badge api-kind-badge--out">Outputs</span>
            </div>
            <div class="table-wrap">
              <table class="api-table api-table--outputs">
                <thead>
                  <tr>
                    <th>Output</th>
                    <th>Payload</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>animationsStart</code></td>
                    <td><code>void</code></td>
                    <td>Fires each time a new batch of animations begins.</td>
                  </tr>
                  <tr>
                    <td><code>animationsFinish</code></td>
                    <td><code>void</code></td>
                    <td>Fires when all currently running animations have settled.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="api-group-label" style="margin-top:8px;margin-bottom:10px">
            <span class="api-component-name">DigitFlowGroupDirective</span>
            <span class="api-kind-badge">Directive</span>
          </div>
          <pre class="code-block">{{ codeGroupImport }}</pre>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .docs-page {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 56px;
        max-width: 1060px;
        margin: 0 auto;
        padding: 48px 32px 80px;
        align-items: start;
      }

      /* Sidebar */
      .docs-sidebar {
        position: sticky;
        top: 72px;
      }

      .sidebar-title {
        font-family: var(--mono);
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--dim);
        margin: 0 0 12px;
      }

      .sidebar-nav {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .sidebar-link {
        display: block;
        font-size: 13px;
        color: var(--muted);
        text-decoration: none;
        padding: 5px 10px;
        border-radius: 6px;
        transition:
          color 0.12s,
          background 0.12s;
      }
      .sidebar-link:hover {
        color: var(--ink);
        background: oklch(95% 0.003 265);
      }
      .sidebar-link.active {
        color: var(--ink);
        font-weight: 500;
        background: oklch(94% 0.004 265);
      }

      .docs-content {
        min-width: 0;
      }

      .docs-title {
        font-size: 28px;
        font-weight: 800;
        letter-spacing: -0.03em;
        margin: 0 0 40px;
      }

      .docs-section {
        margin-bottom: 48px;
      }

      .section-heading {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.02em;
        margin: 0 0 12px;
        padding-top: 8px;
      }

      .sub-heading {
        font-size: 14px;
        font-weight: 600;
        color: var(--ink);
        margin: 24px 0 10px;
      }

      .section-desc {
        font-size: 14px;
        color: var(--muted);
        line-height: 1.6;
        margin: 0 0 16px;
      }

      .section-desc code {
        font-family: var(--mono);
        font-size: 12px;
        color: var(--ink);
        background: oklch(94% 0.004 265);
        padding: 1px 5px;
        border-radius: 4px;
      }

      .code-block {
        margin: 0 0 16px;
        padding: 18px 20px;
        border: 1px solid oklch(91% 0.005 265);
        border-radius: 10px;
        background: oklch(98.5% 0.003 265);
        font-family: var(--mono);
        font-size: 13px;
        line-height: 1.65;
        color: var(--ink);
        overflow-x: auto;
        white-space: pre;
      }

      /* Demo helpers (inside docs-demo slots) */
      .demo-number-wrap {
        font-size: 2.5rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        line-height: 1;
      }

      /* controls slot: flex row, handled by ddemo-controls in docs-demo */
      [slot='controls'] {
        display: contents; /* let ddemo-controls own the layout */
      }

      .demo-btn {
        font-family: var(--mono);
        font-size: 12px;
        padding: 7px 14px;
        border: 1px solid oklch(88% 0.005 265);
        border-radius: 100px;
        background: transparent;
        color: var(--ink);
        cursor: pointer;
        transition:
          background 0.12s,
          border-color 0.12s;
      }
      .demo-btn:hover {
        background: oklch(95% 0.003 265);
      }
      .demo-btn.active {
        background: var(--ink);
        color: var(--bg);
        border-color: var(--ink);
      }
      .demo-control-label {
        font-family: var(--mono);
        font-size: 11px;
        color: var(--dim);
        margin: 0 2px;
      }
      .demo-control-separator {
        width: 1px;
        height: 22px;
        background: oklch(88% 0.005 265);
        margin: 0 4px;
      }

      /* Duration demo */
      .demo-dur-grid {
        display: flex;
        gap: 32px;
        align-items: flex-end;
      }

      .demo-dur-item {
        display: flex;
        flex-direction: column;
        gap: 6px;
        align-items: flex-start;
      }

      .demo-dur-label {
        font-family: var(--mono);
        font-size: 10px;
        color: var(--dim);
      }

      .demo-dur-item ngx-digit-flow {
        font-size: 2.5rem;
        font-weight: 800;
        letter-spacing: -0.03em;
      }

      /* Clock demo */
      .demo-clock {
        display: flex;
        align-items: baseline;
        gap: 4px;
        font-size: 2.5rem;
        font-weight: 800;
        letter-spacing: -0.03em;
      }

      .clock-sep {
        color: var(--dim);
        margin: 0 2px;
      }

      /* Output demo */
      .demo-output-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .output-log {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        min-height: 60px;
      }

      .output-entry {
        font-family: var(--mono);
        font-size: 11px;
        color: var(--muted);
        animation: fadeIn 0.2s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* API table */
      .api-group {
        margin-bottom: 28px;
      }

      .api-group-label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
      }

      .api-component-name {
        font-family: var(--mono);
        font-size: 13px;
        font-weight: 600;
        color: var(--ink);
      }

      .api-kind-badge {
        font-family: var(--mono);
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        padding: 2px 7px;
        border-radius: 4px;
        background: oklch(93% 0.015 255);
        color: oklch(42% 0.18 255);
      }

      .api-kind-badge--out {
        background: oklch(93% 0.015 145);
        color: oklch(40% 0.15 145);
      }

      .table-wrap {
        overflow-x: auto;
        overflow-y: hidden;
        border: 1px solid oklch(90% 0.006 265);
        border-radius: 10px;
        background: oklch(99.2% 0.001 265);
        box-shadow: 0 1px 0 oklch(100% 0 0) inset;
      }

      .api-table {
        width: 100%;
        min-width: 760px;
        border-collapse: separate;
        border-spacing: 0;
        table-layout: fixed;
        font-size: 13px;
      }

      .api-table th {
        text-align: left;
        padding: 11px 16px;
        font-family: var(--mono);
        font-size: 10px;
        font-weight: 700;
        color: oklch(49% 0.015 265);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        background: oklch(96.8% 0.004 265);
        border-bottom: 1px solid oklch(89% 0.006 265);
        white-space: nowrap;
      }

      .api-table--inputs th:first-child {
        width: 20%;
      }
      .api-table--inputs th:nth-child(2) {
        width: 29%;
      }
      .api-table--inputs th:nth-child(3) {
        width: 16%;
      }
      .api-table--inputs th:last-child {
        width: 35%;
      }
      .api-table--outputs {
        min-width: 560px;
      }
      .api-table--outputs th:first-child {
        width: 28%;
      }
      .api-table--outputs th:nth-child(2) {
        width: 18%;
      }
      .api-table--outputs th:last-child {
        width: 54%;
      }

      .api-table td {
        text-align: left;
        padding: 13px 16px;
        border-bottom: 1px solid oklch(94% 0.004 265);
        vertical-align: top;
        color: oklch(28% 0.005 265);
        line-height: 1.55;
        background: oklch(99.6% 0.001 265);
      }

      .api-table tbody tr:not(.api-group-row):hover td {
        background: oklch(98.5% 0.006 255);
      }

      .api-table tr:last-child td {
        border-bottom: none;
      }

      .api-table td:first-child code {
        font-family: var(--mono);
        font-size: 12px;
        font-weight: 600;
        color: oklch(38% 0.12 255);
        background: oklch(94% 0.015 255);
        padding: 2px 6px;
        border-radius: 5px;
      }

      .api-table td:not(:first-child) code {
        font-family: var(--mono);
        font-size: 12px;
        color: var(--ink);
        background: oklch(95% 0.003 265);
        padding: 1px 5px;
        border-radius: 4px;
        white-space: normal;
        overflow-wrap: anywhere;
      }

      .badge-req {
        font-family: var(--mono);
        font-size: 11px;
        font-weight: 600;
        color: oklch(50% 0.17 30);
        background: oklch(95% 0.07 30);
        padding: 2px 7px;
        border-radius: 4px;
      }

      .api-group-row td {
        padding: 18px 16px 7px !important;
        background:
          linear-gradient(90deg, oklch(96% 0.018 255), transparent 72%), oklch(99.6% 0.001 265) !important;
        border-bottom: 1px solid oklch(91.5% 0.006 265) !important;
      }

      .api-group-divider {
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: var(--sans);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: oklch(42% 0.12 255);
      }

      .api-group-divider::after {
        content: '';
        height: 1px;
        flex: 1;
        background: oklch(88% 0.02 255);
      }

      @media (max-width: 900px) {
        .docs-page {
          grid-template-columns: 1fr;
        }
        .docs-sidebar {
          position: static;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .sidebar-title {
          margin: 0;
          white-space: nowrap;
        }
        .sidebar-nav {
          flex-direction: row;
          flex-wrap: wrap;
        }
      }

      @media (max-width: 600px) {
        .docs-page {
          padding: 32px 20px 60px;
        }
        .demo-dur-grid {
          gap: 20px;
        }
        .demo-clock {
          font-size: 1.8rem;
        }
        .docs-sidebar {
          display: none;
        }
      }
    `,
  ],
})
export class DocsComponent implements OnInit, AfterViewInit {
  protected activeSection = signal('installation');

  protected navItems = [
    { id: 'installation', label: 'Installation' },
    { id: 'basic-usage', label: 'Basic Usage' },
    { id: 'format-options', label: 'Format Options' },
    { id: 'prefix-suffix', label: 'Prefix & Suffix' },
    { id: 'custom-duration', label: 'Custom Duration' },
    { id: 'animated-toggle', label: 'Animated Toggle' },
    { id: 'group-directive', label: 'Group Directive' },
    { id: 'outputs', label: 'Outputs' },
    { id: 'easing', label: 'Easing' },
    { id: 'trend', label: 'Trend' },
    { id: 'continuous', label: 'Continuous' },
    { id: 'stagger', label: 'Stagger' },
    { id: 'color-flash', label: 'Color Flash' },
    { id: 'api-reference', label: 'API Reference' },
  ];

  private elRef = inject(ElementRef<HTMLElement>);
  private observer: IntersectionObserver | null = null;

  // Basic
  protected basicVal = signal(1234);

  // Currency
  protected currencyVal = signal(1234.56);
  protected currencyFmt: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' };

  // Percent
  protected pctVal = signal(0.5);
  protected pctFmt: Intl.NumberFormatOptions = {
    style: 'percent',
    minimumFractionDigits: 1,
  };

  // Compact
  protected compactVal = signal(15400);
  protected compactFmt: Intl.NumberFormatOptions = {
    notation: 'compact',
    maximumFractionDigits: 1,
  } as Intl.NumberFormatOptions;

  // Suffix
  protected suffixVal = signal(120);

  // Duration
  protected durVal = signal(42);
  protected durationDemos = [
    { label: '300 ms', ms: 300 },
    { label: '900 ms', ms: 900 },
    { label: '1800 ms', ms: 1800 },
  ];
  private durValues = [42, 1337, 7, 9999, 100];
  private durIdx = 0;

  // Animated
  protected animVal = signal(0);
  protected isAnimated = signal(true);

  // Clock (group demo)
  protected clockH = signal(0);
  protected clockM = signal(0);
  protected clockS = signal(0);

  // Outputs
  protected outputVal = signal(0);
  protected outputLog = signal<string[]>([]);

  // Easing
  protected easingVal = signal(1234);
  private easingValues = [1234, 12345, 999, 9999, 87654];
  private easingIdx = 0;
  protected flipVal = signal(9);

  // Trend
  protected trendVal = signal(50);
  protected trendMode = signal<number | undefined>(undefined);

  // Continuous
  protected contVal = signal(120);

  // Stagger
  protected staggerVal = signal(999);
  private staggerValues = [999, 12000, 85, 1000000, 4500, 7];
  private staggerIdx = 0;

  // Color flash
  protected colorVal = signal(4285.5);

  private destroyRef = inject(DestroyRef);

  ngAfterViewInit() {
    const sections = this.elRef.nativeElement.querySelectorAll(
      '[data-section]',
    ) as NodeListOf<HTMLElement>;
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.activeSection.set(entry.target.getAttribute('data-section') ?? '');
          }
        }
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 },
    );
    sections.forEach((s) => this.observer!.observe(s));
    this.destroyRef.onDestroy(() => this.observer?.disconnect());
  }

  protected navTo(id: string, e: Event): void {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.activeSection.set(id);
  }

  ngOnInit() {
    const now = new Date();
    this.clockH.set(now.getHours());
    this.clockM.set(now.getMinutes());
    this.clockS.set(now.getSeconds());

    const clockId = setInterval(() => {
      const d = new Date();
      this.clockH.set(d.getHours());
      this.clockM.set(d.getMinutes());
      this.clockS.set(d.getSeconds());
    }, 1000);

    this.destroyRef.onDestroy(() => clearInterval(clockId));
  }

  protected triggerDur(): void {
    this.durIdx = (this.durIdx + 1) % this.durValues.length;
    this.durVal.set(this.durValues[this.durIdx]);
  }

  protected triggerEasing(): void {
    this.easingIdx = (this.easingIdx + 1) % this.easingValues.length;
    this.easingVal.set(this.easingValues[this.easingIdx]);
  }

  protected triggerStagger(): void {
    this.staggerIdx = (this.staggerIdx + 1) % this.staggerValues.length;
    this.staggerVal.set(this.staggerValues[this.staggerIdx]);
  }

  protected onStart(): void {
    this.outputLog.update((log) => [
      ...log,
      `animationsStart — ${new Date().toLocaleTimeString()}`,
    ]);
  }

  protected onFinish(): void {
    this.outputLog.update((log) => [
      ...log,
      `animationsFinish — ${new Date().toLocaleTimeString()}`,
    ]);
  }

  /* ── Code snippets ── */
  protected codeImport = `import { DigitFlowComponent } from 'ngx-digit-flow';

@Component({
  imports: [DigitFlowComponent],
  template: '<ngx-digit-flow [value]="42" />'
})
export class MyComponent {}`;

  protected codeBasic = `<ngx-digit-flow [value]="myNumber" [duration]="900" />`;

  protected codeCurrency = `<ngx-digit-flow
  [value]="price"
  [format]="{ style: 'currency', currency: 'USD' }"
  [duration]="900"
/>`;

  protected codePercent = `<ngx-digit-flow
  [value]="0.5"
  [format]="{ style: 'percent', minimumFractionDigits: 1 }"
/>
<!-- Renders: 50.0% -->`;

  protected codeCompact = `<ngx-digit-flow
  [value]="15400"
  [format]="{ notation: 'compact', maximumFractionDigits: 1 }"
/>
<!-- Renders: 15.4K -->`;

  protected codePrefixSuffix = `<!-- suffix -->
<ngx-digit-flow [value]="speed" [suffix]="' km/h'" />

<!-- prefix -->
<ngx-digit-flow [value]="price" [prefix]="'$'" />`;

  protected codeDuration = `<!-- Three instances, same value, different speeds -->
<div ngxDigitFlowGroup>
  <ngx-digit-flow [value]="n" [duration]="300"  />  <!-- fast   -->
  <ngx-digit-flow [value]="n" [duration]="900"  />  <!-- normal -->
  <ngx-digit-flow [value]="n" [duration]="1800" />  <!-- slow   -->
</div>`;

  protected codeAnimated = `<!-- Disable animations entirely -->
<ngx-digit-flow [value]="n" [animated]="false" />

<!-- Respect prefers-reduced-motion automatically — no extra code needed -->`;

  protected codeGroup = `import { DigitFlowGroupDirective } from 'ngx-digit-flow';

<div ngxDigitFlowGroup>
  <ngx-digit-flow [value]="hours"   />
  <span>:</span>
  <ngx-digit-flow [value]="minutes" />
  <span>:</span>
  <ngx-digit-flow [value]="seconds" />
</div>`;

  protected codeOutputs = `<ngx-digit-flow
  [value]="n"
  (animationsStart)="onStart()"
  (animationsFinish)="onFinish()"
/>`;

  protected codeSpinEasing = `<!-- default: damped spring (100-point linear()) -->
<ngx-digit-flow [value]="n" />

<!-- snappy overshoot -->
<ngx-digit-flow [value]="n" spinEasing="overshoot" />

<!-- mechanical linear -->
<ngx-digit-flow [value]="n" spinEasing="linear" />`;

  protected codeFlipEasing = `<!-- default: damped spring (same as spinEasing) -->
<ngx-digit-flow [value]="n" [format]="{ style: 'currency', currency: 'USD' }" />

<!-- overshoot spring on layout shift -->
<ngx-digit-flow
  [value]="n"
  [format]="{ style: 'currency', currency: 'USD' }"
  flipEasing="overshoot"
/>`;

  protected codeTrend = `<!-- auto: digit path follows value delta (default) -->
<ngx-digit-flow [value]="n" />

<!-- always count up through the reel sequence, e.g. 8 → 9 → 0 → 1 -->
<ngx-digit-flow [value]="n" [trend]="1" />

<!-- always count down through the reel sequence, e.g. 1 → 0 → 9 → 8 -->
<ngx-digit-flow [value]="n" [trend]="-1" />

<!-- custom function -->
<ngx-digit-flow [value]="n" [trend]="chooseTrend" />`;

  protected codeContinuous = `<!-- jump to new value (default) -->
<ngx-digit-flow [value]="n" [duration]="500" />

<!-- visually tick through intermediate values with one smooth animation -->
<ngx-digit-flow [value]="n" [duration]="500" [continuous]="true" />`;

  protected codeStagger = `<!-- all core digit motion stays synchronized (default) -->
<ngx-digit-flow [value]="n" />

<!-- 60ms cascade when digits/separators enter or exit -->
<ngx-digit-flow [value]="n" [stagger]="60" />`;

  protected codeColorFlash = `<ngx-digit-flow
  [value]="price"
  colorOnIncrease="#4ade80"
  colorOnDecrease="#f87171"
/>`;

  protected codeGroupImport = `import { DigitFlowGroupDirective } from 'ngx-digit-flow';

// selector: [ngxDigitFlowGroup]
// Wrap multiple ngx-digit-flow elements that form a logical unit.`;
}
