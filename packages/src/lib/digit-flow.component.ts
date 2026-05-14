import {
  afterEveryRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EMPTY_FORMATTED, FormattedNumber, DigitFlowTrend, DigitFlowVariant } from './digit-flow.types';
import { formatToData, getDigitGlyphs } from './formatter';

// ── Easings ──────────────────────────────────────────────────────────────────

// number-flow's spring — 100-point linear() approximation of a damped spring.
const SPIN_EASING =
  'linear(0,.005,.019,.039,.066,.096,.129,.165,.202,.24,.278,.316,.354,.39,.426,.461,' +
  '.494,.526,.557,.586,.614,.64,.665,.689,.711,.731,.751,.769,.786,.802,.817,.831,.844,' +
  '.856,.867,.877,.887,.896,.904,.912,.919,.925,.931,.937,.942,.947,.951,.955,.959,.962,' +
  '.965,.968,.971,.973,.976,.978,.98,.981,.983,.984,.986,.987,.988,.989,.99,.991,.992,' +
  '.992,.993,.994,.994,.995,.995,.996,.996,.9963,.9967,.9969,.9972,.9975,.9977,.9979,' +
  '.9981,.9982,.9984,.9985,.9987,.9988,.9989,1)';

const FLIP_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

// Overshoot spring for gaming variant
const GAMING_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

// ── Variant Presets ───────────────────────────────────────────────────────────

interface VariantPreset {
  duration: number;
  spinEasing: string;
  flipEasing: string;
}

const VARIANT_PRESETS: Record<DigitFlowVariant, VariantPreset> = {
  default: { duration: 900,  spinEasing: SPIN_EASING,   flipEasing: FLIP_EASING },
  gaming:  { duration: 280,  spinEasing: GAMING_EASING, flipEasing: GAMING_EASING },
  metrics: { duration: 800,  spinEasing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', flipEasing: FLIP_EASING },
  finance: { duration: 1400, spinEasing: SPIN_EASING,   flipEasing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' },
  smooth:  { duration: 750,  spinEasing: 'cubic-bezier(0.4, 0, 0.2, 1)', flipEasing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
};

// Max intermediate steps for continuous mode
const MAX_CONTINUOUS_STEPS = 15;

@Component({
  selector: 'ngx-digit-flow',
  standalone: true,
  templateUrl: './digit-flow.component.html',
  styleUrl: './digit-flow.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-animated]': 'animated()' },
})
export class DigitFlowComponent {
  // ── Core inputs ──────────────────────────────────────────────────────────
  value           = input.required<number>();
  format          = input<Intl.NumberFormatOptions>({});
  locales         = input<string | string[] | undefined>(undefined);
  prefix          = input<string>('');
  suffix          = input<string>('');
  animated        = input<boolean>(true);

  // ── Timing inputs — undefined means "inherit from variant" ───────────────
  duration        = input<number | undefined>(undefined);
  opacityDuration = input<number | undefined>(undefined);

  // ── Animation style inputs ────────────────────────────────────────────────
  /** Pre-configured preset; overrides default duration/easing. Individual inputs take priority. */
  variant         = input<DigitFlowVariant>('default');
  /** Custom easing for the digit spin. Overrides variant's spinEasing. */
  spinEasing      = input<string | undefined>(undefined);
  /** Custom easing for the FLIP (layout shift) animation. Overrides variant's flipEasing. */
  flipEasing      = input<string | undefined>(undefined);
  /**
   * Controls digit direction. Use +1 to force upward reels, -1 for downward reels,
   * 0 for per-digit shortest direction, or a function for custom trend logic.
   */
  trend           = input<DigitFlowTrend | undefined>(undefined);

  // ── Feature inputs ────────────────────────────────────────────────────────
  /**
   * Animate through all intermediate integer values between old and new (like a ticker).
   * Best for small delta changes (< 50). Capped at 15 intermediate steps.
   */
  continuous      = input<boolean>(false);
  /**
   * Milliseconds of delay added between each displayed element's animation start.
   * Creates a cascading left-to-right reveal effect.
   */
  stagger         = input<number>(0);
  /** CSS color applied to the host when value increases (fades back to normal). */
  colorOnIncrease = input<string | undefined>(undefined);
  /** CSS color applied to the host when value decreases (fades back to normal). */
  colorOnDecrease = input<string | undefined>(undefined);
  /** Adds a 3D cylinder perspective effect to spinning digits. */
  spin3d          = input<boolean>(false);

  // ── Outputs ───────────────────────────────────────────────────────────────
  animationsStart  = output<void>();
  animationsFinish = output<void>();

  protected data    = signal<FormattedNumber>(EMPTY_FORMATTED);
  protected digitGlyphs = computed(() => getDigitGlyphs(this.locales(), this.format()));

  protected formattedPlainText = computed(() =>
    new Intl.NumberFormat(this.locales(), this.format()).format(this.value())
  );

  // Resolves variant + individual overrides into effective animation settings
  protected effectiveSettings = computed(() => {
    const preset = VARIANT_PRESETS[this.variant()] ?? VARIANT_PRESETS['default'];
    return {
      duration:        this.duration()        ?? preset.duration,
      opacityDuration: this.opacityDuration() ?? 150,
      spinEasing:      this.spinEasing()      ?? preset.spinEasing,
      flipEasing:      this.flipEasing()      ?? preset.flipEasing,
    };
  });

  private platformId = inject(PLATFORM_ID);
  private elRef      = inject(ElementRef<HTMLElement>);
  private destroyRef = inject(DestroyRef);

  // Snapshot state — captured BEFORE each re-render
  private prevRects         = new Map<string, DOMRect>();
  private prevInnerHTML     = new Map<string, string>();
  private prevDigitD        = new Map<string, string>();
  private prevDigitCurrent  = new Map<string, string>();
  private prevDigitValues   = new Map<string, number>();
  private prevNumericValue  = 0;

  // Animation bookkeeping
  private animCount  = 0;
  private _pending   = false;
  private _destroyed = false;
  private _hasRenderedValue = false;
  private _live: Animation[] = [];
  private _spinCount = new Map<HTMLElement, number>();

  // Continuous mode state
  private _continuousQueue: FormattedNumber[] = [];
  private _continuousValues: number[]         = [];
  private _continuousStepDuration             = 0;

  // Per-batch overrides (cleared after each runAnimations call)
  private _targetDisplayValue: number | null = null;
  private _durationOverride: number | null   = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this._destroyed = true;
      this._continuousQueue = [];
      this._continuousValues = [];
      for (const a of this._live) {
        try { a.cancel(); } catch { /* AbortError is normal */ }
      }
      this._live = [];
    });

    effect(() => {
      const v   = this.value();
      const fmt = this.format();
      const loc = this.locales();
      const pfx = this.prefix();
      const sfx = this.suffix();

      if (!this._hasRenderedValue) {
        untracked(() => this.data.set(formatToData(v, fmt, loc, pfx, sfx)));
        this.prevNumericValue = v;
        this._hasRenderedValue = true;
        return;
      }

      if (isPlatformBrowser(this.platformId)) {
        this.snapshot();
      }

      // Cancel any in-flight continuous queue when a new value arrives
      this._continuousQueue  = [];
      this._continuousValues = [];

      if (isPlatformBrowser(this.platformId) && this.animated() && this.continuous()) {
        const from  = this.prevNumericValue;
        const diff  = v - from;
        const steps = Math.min(Math.ceil(Math.abs(diff)), MAX_CONTINUOUS_STEPS);

        if (steps > 1) {
          const totalDur = this.effectiveSettings().duration;
          this._continuousStepDuration = Math.max(80, totalDur / steps);

          for (let i = 1; i <= steps; i++) {
            const iv = i === steps ? v : Math.round(from + diff * (i / steps));
            this._continuousQueue.push(formatToData(iv, fmt, loc, pfx, sfx));
            this._continuousValues.push(iv);
          }

          // Process first step (snapshot was just taken above)
          this.processContinuousQueue(true);
          return;
        }
      }

      // Normal mode
      untracked(() => this.data.set(formatToData(v, fmt, loc, pfx, sfx)));
      if (isPlatformBrowser(this.platformId) && this.animated()) {
        this._pending = true;
      }
    });

    if (isPlatformBrowser(this.platformId)) {
      afterEveryRender({
        read: () => {
          if (this._pending) {
            this._pending = false;
            this.runAnimations();
          }
        },
      });
    }
  }

  // ─── Continuous queue ─────────────────────────────────────────────────────

  private processContinuousQueue(isFirst = false): void {
    if (this._continuousQueue.length === 0) {
      return;
    }

    const nextFormatted = this._continuousQueue.shift()!;
    const nextValue     = this._continuousValues.shift()!;

    if (!isFirst) {
      // Subsequent steps: snapshot NOW (DOM settled from previous step animation)
      this.snapshot();
    }

    this._targetDisplayValue = nextValue;
    this._durationOverride   = this._continuousStepDuration;

    untracked(() => this.data.set(nextFormatted));
    this._pending = true;
  }

  // ─── Snapshot ─────────────────────────────────────────────────────────────

  private snapshot(): void {
    const host = this.elRef.nativeElement as HTMLElement;
    this.prevRects.clear();
    this.prevInnerHTML.clear();
    this.prevDigitD.clear();
    this.prevDigitCurrent.clear();
    this.prevDigitValues.clear();

    untracked(() => {
      [...this.data().integer, ...this.data().fraction].forEach(p => {
        if (p.type === 'integer' || p.type === 'fraction') {
          this.prevDigitValues.set(p.key, this.getPartDigitValue(p));
        }
      });
    });

    host.querySelectorAll<HTMLElement>('[data-key]').forEach(el => {
      const key = el.getAttribute('data-key')!;
      this.prevRects.set(key, el.getBoundingClientRect());
      this.prevInnerHTML.set(key, el.innerHTML);
      if (el.classList.contains('df-digit')) {
        const cs = getComputedStyle(el);
        this.prevDigitD.set(key, cs.getPropertyValue('--_df-d').trim() || '0');
        this.prevDigitCurrent.set(key, (el.style.getPropertyValue('--_df-current') || '0').trim());
      }
    });
  }

  // ─── Animation ────────────────────────────────────────────────────────────

  private runAnimations(): void {
    if (this._destroyed) return;

    const host      = this.elRef.nativeElement as HTMLElement;
    const settings  = this.effectiveSettings();
    const reduced   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Per-step override for continuous mode
    const isContinuousStep = this._durationOverride !== null;
    const rawDur = isContinuousStep ? this._durationOverride! : settings.duration;
    this._durationOverride = null;

    const d  = reduced ? 0 : rawDur;
    const od = reduced ? 0 : settings.opacityDuration;

    // Trend: determines scroll direction and color animation
    const newNumericValue = this._targetDisplayValue !== null
      ? this._targetDisplayValue
      : untracked(() => this.value());
    this._targetDisplayValue = null;

    const trend    = this.resolveTrend(this.prevNumericValue, newNumericValue);
    const staggerMs = this.stagger();

    const spinOpts: KeyframeAnimationOptions = {
      duration: d, easing: settings.spinEasing, fill: 'none', composite: 'accumulate',
    };
    const flipOpts: KeyframeAnimationOptions = {
      duration: d, easing: settings.flipEasing, fill: 'none', composite: 'accumulate',
    };
    const fadeOpts: KeyframeAnimationOptions = {
      duration: od, easing: 'ease-out', fill: 'both', composite: 'replace',
    };

    const batch: Animation[] = [];
    const newKeys = new Set<string>();
    let elemIdx = 0;

    host.querySelectorAll<HTMLElement>('[data-key]').forEach(el => {
      const key      = el.getAttribute('data-key')!;
      newKeys.add(key);
      const newRect  = el.getBoundingClientRect();
      const prevRect = this.prevRects.get(key);
      const staggerDelay = staggerMs > 0 ? elemIdx * staggerMs : 0;
      elemIdx++;

      if (el.classList.contains('df-digit')) {
        const digit     = this.getDigitValue(key);
        const fromDigit = this.prevDigitValues.has(key)
          ? this.prevDigitValues.get(key)!
          : digit;
        const delta = this.getTrendDelta(fromDigit, digit, trend);

        if (delta !== 0 && d > 0) {
          this.incrementSpin(el);
          const a = el.animate(
            { '--_df-d': [-delta, 0] } as PropertyIndexedKeyframes,
            { ...spinOpts, delay: staggerDelay }
          );
          batch.push(a);
          a.finished
            .then(() => this.decrementSpin(el))
            .catch(() => this.decrementSpin(el));
        }

        if (prevRect) {
          const dx = prevRect.left - newRect.left;
          if (Math.abs(dx) > 0.5) {
            batch.push(el.animate(
              [{ transform: `translateX(${dx}px)` }, { transform: 'translateX(0)' }],
              { ...flipOpts, delay: staggerDelay }
            ));
          }
        } else {
          batch.push(el.animate([{ opacity: '0' }, { opacity: '1' }], { ...fadeOpts, delay: staggerDelay }));
        }

      } else {
        if (prevRect) {
          const dx = prevRect.left - newRect.left;
          if (Math.abs(dx) > 0.5) {
            batch.push(el.animate(
              [{ transform: `translateX(${dx}px)` }, { transform: 'translateX(0)' }],
              { ...flipOpts, delay: staggerDelay }
            ));
          }
        } else {
          batch.push(el.animate([{ opacity: '0' }, { opacity: '1' }], { ...fadeOpts, delay: staggerDelay }));
        }
      }
    });

    // Ghost exits
    this.prevRects.forEach((rect, key) => {
      if (newKeys.has(key)) return;
      const ghost = this.buildGhost(key, rect, host);
      host.appendChild(ghost);
      const a = ghost.animate([{ opacity: '1' }, { opacity: '0' }], { ...fadeOpts });
      batch.push(a);
      a.finished.then(() => ghost.remove()).catch(() => ghost.remove());
    });

    // Color animation on trend change
    if (d > 0 && (!isContinuousStep || this._continuousQueue.length === 0)) {
      const colorIncrease = this.colorOnIncrease();
      const colorDecrease = this.colorOnDecrease();
      let colorAnimation: Animation | null = null;
      if (trend > 0 && colorIncrease) {
        colorAnimation = host.animate(
          [{ color: colorIncrease }, { color: '' }],
          { duration: Math.max(od * 4, 300), easing: 'ease-out', fill: 'none' }
        );
      } else if (trend < 0 && colorDecrease) {
        colorAnimation = host.animate(
          [{ color: colorDecrease }, { color: '' }],
          { duration: Math.max(od * 4, 300), easing: 'ease-out', fill: 'none' }
        );
      }

      if (colorAnimation && !isContinuousStep) {
        batch.push(colorAnimation);
      }
    }

    this.prevNumericValue = newNumericValue;

    if (batch.length === 0) {
      // Still need to continue continuous queue even with no visible animations
      if (this._continuousQueue.length > 0) {
        this.processContinuousQueue(false);
      }
      return;
    }

    this._live.push(...batch);
    this.animCount++;
    this.animationsStart.emit();

    Promise.allSettled(batch.map(a => a.finished)).then(() => {
      const batchSet = new Set(batch);
      this._live = this._live.filter(a => !batchSet.has(a));
      this.animCount--;

      if (this.animCount === 0 && !this._destroyed) {
        if (this._continuousQueue.length > 0) {
          // Continue continuous chain
          this.processContinuousQueue(false);
        } else {
          this.animationsFinish.emit();
        }
      }
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private getDigitValue(key: string): number {
    const part = [...this.data().integer, ...this.data().fraction].find(p => p.key === key);
    return part ? this.getPartDigitValue(part) : 0;
  }

  private getPartDigitValue(part: { value: string; numericValue?: number }): number {
    return part.numericValue ?? Number(part.value);
  }

  private resolveTrend(oldValue: number, newValue: number): number {
    const configured = this.trend();
    const trend = typeof configured === 'function'
      ? configured(oldValue, newValue)
      : configured ?? Math.sign(newValue - oldValue);
    return Math.sign(trend);
  }

  private getTrendDelta(from: number, to: number, trend: number): number {
    const length = 10;
    const diff   = to - from;
    const t      = trend || Math.sign(diff);
    if (t > 0 && to < from) return length - from + to;
    if (t < 0 && to > from) return to - length - from;
    return diff;
  }

  private incrementSpin(el: HTMLElement): void {
    const c = (this._spinCount.get(el) ?? 0) + 1;
    this._spinCount.set(el, c);
    if (c === 1) el.classList.add('is-spinning');
  }

  private decrementSpin(el: HTMLElement): void {
    const c = Math.max(0, (this._spinCount.get(el) ?? 1) - 1);
    if (c === 0) {
      this._spinCount.delete(el);
      el.classList.remove('is-spinning');
    } else {
      this._spinCount.set(el, c);
    }
  }

  private buildGhost(key: string, rect: DOMRect, host: HTMLElement): HTMLElement {
    const ghost = document.createElement('span');
    const cs    = getComputedStyle(host);
    ghost.style.cssText =
      `position:fixed;left:${rect.left}px;top:${rect.top}px;` +
      `width:${rect.width}px;height:${rect.height}px;` +
      `pointer-events:none;overflow:hidden;display:inline-flex;` +
      `align-items:center;font:${cs.font};color:${cs.color}`;

    const savedHTML = this.prevInnerHTML.get(key);
    if (savedHTML) {
      ghost.innerHTML = savedHTML;
      const savedD = this.prevDigitD.get(key);
      const savedC = this.prevDigitCurrent.get(key);
      if (savedD !== undefined) ghost.style.setProperty('--_df-d', savedD);
      if (savedC !== undefined) ghost.style.setProperty('--_df-current', savedC);
      ghost.querySelectorAll<HTMLElement>('[inert]').forEach(el => {
        el.style.display = 'none';
      });
    }
    return ghost;
  }
}
