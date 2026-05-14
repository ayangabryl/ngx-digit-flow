import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const INSTALL_SNIPPET = `npm install ngx-digit-flow`;

const IMPORT_SNIPPET = `import { DigitFlowComponent } from 'ngx-digit-flow';

@Component({
  imports: [DigitFlowComponent],
  template: \`
    <ngx-digit-flow
      [value]="price()"
      [format]="{ style: 'currency', currency: 'USD' }"
    />
  \`,
})
export class MyComponent {
  price = signal(1299.99);
}`;

const INPUTS = [
  // ── Core ─────────────────────────────────────────────────────────────────
  { name: 'value',           type: 'number',                              required: true,  default: '—',          desc: 'The number to display and animate to' },
  { name: 'format',          type: 'Intl.NumberFormatOptions',            required: false, default: '{}',         desc: 'Intl.NumberFormat options (currency, percent, compact…)' },
  { name: 'locales',         type: 'string | string[]',                   required: false, default: 'undefined',  desc: 'BCP 47 locale(s) for number formatting, including localized digit glyphs' },
  { name: 'prefix',          type: 'string',                              required: false, default: "''",         desc: 'Custom text prepended before the number' },
  { name: 'suffix',          type: 'string',                              required: false, default: "''",         desc: 'Custom text appended after the number' },
  { name: 'animated',        type: 'boolean',                             required: false, default: 'true',       desc: 'Enable or disable all digit animations' },
  // ── Timing ───────────────────────────────────────────────────────────────
  { name: 'duration',        type: 'number',                              required: false, default: '900',        desc: 'Spin + FLIP animation duration in ms.' },
  { name: 'opacityDuration', type: 'number',                              required: false, default: '150',        desc: 'Fade in/out duration in ms for appearing/disappearing elements.' },
  { name: 'transformTiming', type: 'DigitFlowTiming',                     required: false, default: 'duration+flipEasing', desc: 'Full WAAPI timing for the FLIP layout animation. Overrides duration and flipEasing.' },
  { name: 'spinTiming',      type: 'DigitFlowTiming',                     required: false, default: 'transformTiming', desc: 'Full WAAPI timing for the digit spin animation. Falls back to transformTiming.' },
  { name: 'opacityTiming',   type: 'DigitFlowTiming',                     required: false, default: 'opacityDuration', desc: 'Full WAAPI timing for fade animations.' },
  // ── Animation style ──────────────────────────────────────────────────────
  { name: 'spinEasing',      type: 'string',                              required: false, default: 'spring',     desc: 'CSS easing for the digit spin — each digit scrolls vertically on a 0-9 reel. Defaults to a damped spring.' },
  { name: 'flipEasing',      type: 'string',                              required: false, default: 'ease-out',   desc: 'CSS easing for the FLIP animation — digits slide horizontally when the digit count changes (e.g. 9→10).' },
  { name: 'trend',           type: 'number | (oldValue,value)=>number',    required: false, default: 'auto',       desc: 'Controls reel direction. Use 1, -1, 0, or a custom function.' },
  // ── Features ─────────────────────────────────────────────────────────────
  { name: 'continuous',      type: 'boolean',                             required: false, default: 'false',      desc: 'Ticker mode: animate through every intermediate integer value (max 15 steps).' },
  { name: 'digits',          type: 'Record<number,{max?:number}>',         required: false, default: '{}',         desc: 'Configure digit reel ranges by decimal position for clocks/countdowns.' },
  { name: 'respectMotionPreference', type: 'boolean',                     required: false, default: 'true',       desc: 'Disable animations when the user prefers reduced motion.' },
  { name: 'stagger',         type: 'number',                              required: false, default: '0',          desc: 'Milliseconds of delay between each element\'s animation. Creates a cascade effect.' },
  { name: 'colorOnIncrease', type: 'string',                              required: false, default: 'undefined',  desc: 'CSS color flashed on the host when value increases (e.g. "#4ade80").' },
  { name: 'colorOnDecrease', type: 'string',                              required: false, default: 'undefined',  desc: 'CSS color flashed on the host when value decreases (e.g. "#f87171").' },
  { name: 'spin3d',          type: 'boolean',                             required: false, default: 'false',      desc: 'Adds a 3D cylinder effect — digits tilt on the X-axis while spinning. Tune via --df-3d-angle and --df-3d-perspective CSS properties.' },
];

const OUTPUTS = [
  { name: 'animationsStart',  desc: 'Emits when digit animations begin' },
  { name: 'animationsFinish', desc: 'Emits when all digit animations complete' },
];

@Component({
  selector: 'app-api-docs',
  standalone: true,
  template: `
    <section class="api" id="install">
      <div class="api__inner">

        <div class="section-tag">API</div>
        <h2 class="section-title">Developer experience first</h2>
        <p class="section-sub">
          One component. Signals-native inputs. Zero configuration required.
        </p>

        <!-- Install -->
        <div class="api__block">
          <div class="api__block-title">Install</div>
          <div class="code-block">
            <pre><code>{{ installSnippet }}</code></pre>
            <button class="copy-btn" (click)="copy(installSnippet)" [class.copied]="copied() === 'install'">
              {{ copied() === 'install' ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <!-- Usage -->
        <div class="api__block">
          <div class="api__block-title">Usage</div>
          <div class="code-block">
            <pre><code>{{ importSnippet }}</code></pre>
            <button class="copy-btn" (click)="copy(importSnippet, 'import')" [class.copied]="copied() === 'import'">
              {{ copied() === 'import' ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <!-- Inputs table -->
        <div class="api__block">
          <div class="api__block-title">Inputs</div>
          <div class="api__table-wrap">
            <table class="api__table">
              <thead>
                <tr>
                  <th>Input</th>
                  <th>Type</th>
                  <th>Default</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                @for (row of inputs; track row.name) {
                  <tr>
                    <td><code>{{ row.name }}</code> @if (row.required) { <span class="required">*</span> }</td>
                    <td><code class="type">{{ row.type }}</code></td>
                    <td><code>{{ row.default }}</code></td>
                    <td class="desc">{{ row.desc }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Outputs table -->
        <div class="api__block">
          <div class="api__block-title">Outputs</div>
          <div class="api__table-wrap">
            <table class="api__table">
              <thead>
                <tr><th>Output</th><th>Description</th></tr>
              </thead>
              <tbody>
                @for (row of outputs; track row.name) {
                  <tr>
                    <td><code>{{ row.name }}</code></td>
                    <td class="desc">{{ row.desc }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  `,
  styleUrl: './api-docs.component.scss',
})
export class ApiDocsComponent {
  private platformId = inject(PLATFORM_ID);
  installSnippet = INSTALL_SNIPPET;
  importSnippet  = IMPORT_SNIPPET;
  inputs  = INPUTS;
  outputs = OUTPUTS;
  copied  = signal<string | null>(null);

  copy(text: string, key = 'install') {
    if (!isPlatformBrowser(this.platformId)) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(key);
      setTimeout(() => this.copied.set(null), 2000);
    });
  }
}
