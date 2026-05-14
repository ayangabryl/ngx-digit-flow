import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DigitFlowComponent } from 'ngx-digit-flow';

const NPM_CMD   = 'npm install ngx-digit-flow';
const SKILL_CMD = 'npx skills add https://github.com/ayangabryl/ngx-digit-flow --skill ngx-digit-flow';

interface HeroStep {
  value: number;
  format: Intl.NumberFormatOptions;
  hint: string;
}

const STEPS: HeroStep[] = [
  {
    value: 1_234_567.89,
    format: { style: 'currency', currency: 'USD' },
    hint: "style: 'currency'",
  },
  {
    value: 42,
    format: {},
    hint: 'integer',
  },
  {
    value: 3.14159,
    format: { minimumFractionDigits: 5, maximumFractionDigits: 5 },
    hint: 'minimumFractionDigits: 5',
  },
  {
    value: 0.9987,
    format: { style: 'percent', minimumFractionDigits: 2 },
    hint: "style: 'percent'",
  },
  {
    value: 150_000_000,
    format: { notation: 'compact' } as Intl.NumberFormatOptions,
    hint: "notation: 'compact'",
  },
  {
    value: 0,
    format: {},
    hint: 'zero',
  },
];

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DigitFlowComponent, RouterLink],
  template: `
    <section class="hero">
      <div class="hero-body">
        <div class="number-stage">
          <ngx-digit-flow
            [value]="step().value"
            [format]="step().format"
            [duration]="1100"
          />
        </div>

        <h1 class="tagline">Numbers that feel alive.</h1>

        <p class="sub">
          Individual digit animations for Angular — powered by Web Animations API
          and <code>Intl.NumberFormat</code>. Signals-first. Zero dependencies. SSR-safe.
        </p>

        <div class="installs">
          <div class="install">
            <span class="install-tag">npm</span>
            <code class="install-code">{{ npmCmd }}</code>
            <button class="copy-btn" (click)="copy(npmCmd, 'npm')" aria-label="Copy npm command">
              @if (copied() === 'npm') {
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              } @else {
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="5" y="1" width="8" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M9 10v2a1.5 1.5 0 01-1.5 1.5H1.5A1.5 1.5 0 010 12V5A1.5 1.5 0 011.5 3.5H4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
              }
            </button>
          </div>
          <div class="install install--skill">
            <span class="install-tag">Skill</span>
            <code class="install-code">{{ skillCmd }}</code>
            <button class="copy-btn" (click)="copy(skillCmd, 'skill')" aria-label="Copy skill command">
              @if (copied() === 'skill') {
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              } @else {
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="5" y="1" width="8" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M9 10v2a1.5 1.5 0 01-1.5 1.5H1.5A1.5 1.5 0 010 12V5A1.5 1.5 0 011.5 3.5H4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
              }
            </button>
          </div>
        </div>

        <div class="cta">
          <a class="btn-primary" routerLink="/demos">See demos</a>
          <a class="btn-ghost" routerLink="/docs">Documentation</a>
        </div>

        <div class="badges">
          <span class="badge">Angular 17+</span>
          <span class="badge">Signals</span>
          <span class="badge">WAAPI</span>
          <span class="badge">FLIP</span>
          <span class="badge">SSR-safe</span>
        </div>
      </div>

      <div class="step-indicator">
        <span class="step-hint">{{ step().hint }}</span>
        <div class="step-dots">
          @for (s of steps; track $index) {
            <button
              class="dot"
              [class.active]="stepIdx() === $index"
              (click)="goTo($index)"
              [attr.aria-label]="'Step ' + ($index + 1)"
            ></button>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .hero {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px 80px;
      position: relative;
    }

    .hero-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 28px;
      max-width: 680px;
      width: 100%;
    }

    .number-stage {
      font-size: clamp(3rem, 9vw, 6.5rem);
      font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1;
      min-height: 1.1em;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tagline {
      font-size: clamp(1.3rem, 3vw, 1.7rem);
      font-weight: 700;
      letter-spacing: -0.025em;
      text-align: center;
      margin: 0;
    }

    .sub {
      font-size: 15px;
      color: var(--muted);
      text-align: center;
      line-height: 1.6;
      max-width: 540px;
      margin: 0;
    }

    .sub code {
      font-family: var(--mono);
      font-size: 13px;
      color: var(--ink);
    }

    .installs {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      max-width: 580px;
    }

    .install {
      display: flex;
      align-items: center;
      gap: 10px;
      border: 1px solid oklch(88% 0.002 265);
      border-radius: 14px;
      padding: 11px 14px 11px 18px;
      background: #fff;
      cursor: default;
      min-width: 0;
      overflow: hidden;
    }

    .install--skill {
      border-style: dashed;
    }

    .install-tag {
      font-family: var(--mono);
      font-size: 10px;
      font-weight: 600;
      color: var(--muted);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .install-code {
      font-family: var(--mono);
      font-size: 12px;
      color: var(--ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
      user-select: all;
    }

    .copy-btn {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      border-radius: 8px;
      color: var(--muted);
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      padding: 0;
    }

    .copy-btn:hover {
      background: oklch(94% 0.002 265);
      color: var(--ink);
    }

    .cta {
      display: flex;
      gap: 10px;
    }

    .btn-primary,
    .btn-ghost {
      font-family: var(--font);
      font-size: 14px;
      font-weight: 500;
      padding: 11px 24px;
      border-radius: 100px;
      text-decoration: none;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      cursor: pointer;
    }

    .btn-primary {
      background: var(--ink);
      color: #fff;
      border: 1px solid var(--ink);
    }
    .btn-primary:hover { background: oklch(22% 0.008 265); }

    .btn-ghost {
      background: #fff;
      color: var(--ink);
      border: 1px solid oklch(86% 0.003 265);
    }
    .btn-ghost:hover { border-color: oklch(60% 0.003 265); }

    .badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .badge {
      font-family: var(--font);
      font-size: 12px;
      font-weight: 500;
      color: var(--muted);
      border: 1px solid oklch(88% 0.002 265);
      background: #fff;
      border-radius: 100px;
      padding: 5px 13px;
    }

    .step-indicator {
      position: absolute;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      white-space: nowrap;
    }

    .step-hint {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--muted);
    }

    .step-dots {
      display: flex;
      gap: 6px;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      border: none;
      background: oklch(84% 0.005 265);
      cursor: pointer;
      transition: background 0.2s, transform 0.2s;
      padding: 0;
    }

    .dot.active {
      background: var(--ink);
      transform: scale(1.4);
    }

    @media (max-width: 600px) {
      .hero { padding-bottom: 72px; }
      .hero-body { gap: 20px; }
      .cta { width: 100%; }
      .btn-primary,
      .btn-ghost { flex: 1; text-align: center; }
    }
  `],
})
export class HomeComponent implements OnInit {
  protected steps = STEPS;
  protected stepIdx = signal(0);
  protected step = signal(STEPS[0]);
  protected copied = signal<string | null>(null);

  protected readonly npmCmd   = NPM_CMD;
  protected readonly skillCmd = SKILL_CMD;

  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    const id = setInterval(() => {
      const next = (this.stepIdx() + 1) % STEPS.length;
      this.stepIdx.set(next);
      this.step.set(STEPS[next]);
    }, 2500);
    this.destroyRef.onDestroy(() => clearInterval(id));
  }

  protected goTo(idx: number): void {
    this.stepIdx.set(idx);
    this.step.set(STEPS[idx]);
  }

  protected copy(text: string, key: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(key);
      setTimeout(() => this.copied.set(null), 1500);
    });
  }
}
