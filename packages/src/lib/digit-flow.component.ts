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
import {
  DigitFlowDigits,
  DigitFlowTiming,
  DigitFlowTrend,
  EMPTY_FORMATTED,
  FormattedNumber,
} from './digit-flow.types';
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
  value = input.required<number>();
  format = input<Intl.NumberFormatOptions>({});
  locales = input<string | string[] | undefined>(undefined);
  prefix = input<string>('');
  suffix = input<string>('');
  animated = input<boolean>(true);

  // ── Timing inputs ─────────────────────────────────────────────────────────
  duration = input<number | undefined>(undefined);
  opacityDuration = input<number | undefined>(undefined);
  /** Full timing options for layout/FLIP animations. Overrides duration + flipEasing. */
  transformTiming = input<DigitFlowTiming | undefined>(undefined);
  /** Full timing options for digit spin animations. Falls back to transformTiming, then duration + spinEasing. */
  spinTiming = input<DigitFlowTiming | undefined>(undefined);
  /** Full timing options for fade in/out animations. Overrides opacityDuration. */
  opacityTiming = input<DigitFlowTiming | undefined>(undefined);

  // ── Animation style inputs ────────────────────────────────────────────────
  /** CSS easing for the digit spin (the vertical reel). Defaults to a damped spring curve. */
  spinEasing = input<string | undefined>(undefined);
  /** CSS easing for the FLIP layout animation (horizontal shift when digit count changes). */
  flipEasing = input<string | undefined>(undefined);
  /**
   * Controls digit direction. Use +1 to force upward reels, -1 for downward reels,
   * 0 for per-digit shortest direction, or a function for custom trend logic.
   */
  trend = input<DigitFlowTrend | undefined>(undefined);

  // ── Feature inputs ────────────────────────────────────────────────────────
  /**
   * When a higher-place digit changes, spin all lower-place unchanged digits a full reel
   * loop — giving the illusion that the whole number is ticking through intermediate values.
   * Matches number-flow's continuous plugin behaviour.
   */
  continuous = input<boolean>(false);
  /** Configure digit reels by decimal position. Useful for clocks, e.g. `{ 1: { max: 5 } }`. */
  digits = input<DigitFlowDigits>({});
  /** Whether user reduced-motion preference should disable animation. */
  respectMotionPreference = input<boolean>(true);
  /**
   * Milliseconds of delay added between each displayed element's animation start.
   * Creates a cascading left-to-right reveal effect.
   */
  stagger = input<number>(0);
  /** CSS color applied to the host when value increases (fades back to normal). */
  colorOnIncrease = input<string | undefined>(undefined);
  /** CSS color applied to the host when value decreases (fades back to normal). */
  colorOnDecrease = input<string | undefined>(undefined);

  // ── Outputs ───────────────────────────────────────────────────────────────
  animationsStart = output<void>();
  animationsFinish = output<void>();

  protected data = signal<FormattedNumber>(EMPTY_FORMATTED);
  protected digitGlyphs = computed(() => getDigitGlyphs(this.locales(), this.format()));

  protected formattedPlainText = computed(() =>
    new Intl.NumberFormat(this.locales(), this.format()).format(this.value()),
  );

  protected effectiveSettings = computed(() => {
    const duration = this.duration() ?? 900;
    return {
      duration,
      opacityDuration: this.opacityDuration() ?? Math.round(duration / 2),
      spinEasing: this.spinEasing() ?? SPIN_EASING,
      flipEasing: this.flipEasing() ?? FLIP_EASING,
      transformTiming: this.transformTiming(),
      spinTiming: this.spinTiming(),
      opacityTiming: this.opacityTiming(),
    };
  });

  private platformId = inject(PLATFORM_ID);
  private elRef = inject(ElementRef<HTMLElement>);
  private destroyRef = inject(DestroyRef);

  // Snapshot state — captured BEFORE each re-render
  private prevRects = new Map<string, DOMRect>();
  private prevInnerHTML = new Map<string, string>();
  private prevDigitD = new Map<string, string>();
  private prevDigitCurrent = new Map<string, string>();
  private prevDigitValues = new Map<string, number>();
  private prevDigitOrder: string[] = [];
  private prevNumericValue = 0;

  // Animation bookkeeping
  private animCount = 0;
  private _pending = false;
  private _destroyed = false;
  private _hasRenderedValue = false;
  private _live: Animation[] = [];
  private _spinCount = new Map<HTMLElement, number>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this._destroyed = true;
      for (const a of this._live) {
        try {
          a.cancel();
        } catch {
          /* AbortError is normal */
        }
      }
      this._live = [];
    });

    effect(() => {
      const v = this.value();
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

  // ─── Snapshot ─────────────────────────────────────────────────────────────

  private snapshot(): void {
    const host = this.elRef.nativeElement as HTMLElement;
    this.prevRects.clear();
    this.prevInnerHTML.clear();
    this.prevDigitD.clear();
    this.prevDigitCurrent.clear();
    this.prevDigitValues.clear();
    this.prevDigitOrder = [];

    untracked(() => {
      [...this.data().integer, ...this.data().fraction].forEach((p) => {
        if (p.type === 'integer' || p.type === 'fraction') {
          this.prevDigitValues.set(p.key, this.getPartDigitValue(p));
          this.prevDigitOrder.push(p.key);
        }
      });
    });

    host.querySelectorAll<HTMLElement>('[data-key]').forEach((el) => {
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

    const host = this.elRef.nativeElement as HTMLElement;
    const settings = this.effectiveSettings();
    const reduced =
      this.respectMotionPreference() &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const d = reduced ? 0 : settings.duration;
    const od = reduced ? 0 : settings.opacityDuration;

    const newNumericValue = untracked(() => this.value());
    const trend = this.resolveTrend(this.prevNumericValue, newNumericValue);
    const staggerMs = this.stagger();

    const baseTransformTiming = settings.transformTiming ?? {
      duration: d,
      easing: settings.flipEasing,
    };
    const spinOpts: KeyframeAnimationOptions = {
      ...baseTransformTiming,
      easing: settings.spinEasing,
      ...(settings.spinTiming ?? {}),
      duration: reduced ? 0 : (settings.spinTiming?.duration ?? baseTransformTiming.duration),
      fill: 'none',
      composite: 'accumulate',
    };
    const flipOpts: KeyframeAnimationOptions = {
      ...baseTransformTiming,
      duration: reduced ? 0 : baseTransformTiming.duration,
      fill: 'none',
      composite: 'accumulate',
    };
    const fadeOpts: KeyframeAnimationOptions = {
      duration: od,
      easing: 'ease-out',
      fill: 'both',
      composite: 'replace',
      ...(settings.opacityTiming ?? {}),
    };
    if (reduced) fadeOpts.duration = 0;

    // ── Continuous mode: find the first changed digit position.
    // Unchanged digits below that position spin a full reel loop, giving the visual
    // illusion of ticking through intermediate values — same technique as
    // number-flow's continuous plugin. No step-chaining needed; it's one animation.
    const continuousStartPos =
      this.continuous() && d > 0 && trend !== 0 ? this.getContinuousStartPos() : undefined;

    const batch: Animation[] = [];
    const newKeys = new Set<string>();
    let elemIdx = 0;

    host.querySelectorAll<HTMLElement>('[data-key]').forEach((el) => {
      const key = el.getAttribute('data-key')!;
      newKeys.add(key);
      const newRect = el.getBoundingClientRect();
      const prevRect = this.prevRects.get(key);
      const staggerDelay = staggerMs > 0 ? elemIdx * staggerMs : 0;
      elemIdx++;

      if (el.classList.contains('df-digit')) {
        const digit = this.getDigitValue(key);
        const fromDigit = this.prevDigitValues.has(key) ? this.prevDigitValues.get(key)! : 0;
        const rawDelta = this.getTrendDelta(fromDigit, digit, trend, this.getDigitLength(key));
        const digitPos = this.getDigitPosition(key);

        // Continuous effect: unchanged digit at or below the first changed position
        // spins a full reel loop so it appears to tick through.
        const isLowerUnchanged =
          this.continuous() &&
          rawDelta === 0 &&
          continuousStartPos !== undefined &&
          digitPos !== undefined &&
          continuousStartPos >= digitPos;
        const delta = isLowerUnchanged ? this.getDigitLength(key) * trend : rawDelta;

        if (delta !== 0 && d > 0) {
          this.incrementSpin(el);
          const a = el.animate(
            { '--_df-d': [-delta, 0] } as PropertyIndexedKeyframes,
            this.addStaggerDelay(spinOpts, staggerDelay),
          );
          batch.push(a);
          a.finished.then(() => this.decrementSpin(el)).catch(() => this.decrementSpin(el));
        }

        if (prevRect) {
          const dx = prevRect.left - newRect.left;
          if (Math.abs(dx) > 0.5) {
            batch.push(
              el.animate(
                [{ transform: `translateX(${dx}px)` }, { transform: 'translateX(0)' }],
                this.addStaggerDelay(flipOpts, staggerDelay),
              ),
            );
          }
        } else {
          batch.push(
            el.animate(
              [{ opacity: '0' }, { opacity: '1' }],
              this.addStaggerDelay(fadeOpts, staggerDelay),
            ),
          );
        }
      } else {
        if (prevRect) {
          const dx = prevRect.left - newRect.left;
          if (Math.abs(dx) > 0.5) {
            batch.push(
              el.animate(
                [{ transform: `translateX(${dx}px)` }, { transform: 'translateX(0)' }],
                this.addStaggerDelay(flipOpts, staggerDelay),
              ),
            );
          }
        } else {
          batch.push(
            el.animate(
              [{ opacity: '0' }, { opacity: '1' }],
              this.addStaggerDelay(fadeOpts, staggerDelay),
            ),
          );
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

    // Color flash on value change direction
    if (d > 0) {
      const colorIncrease = this.colorOnIncrease();
      const colorDecrease = this.colorOnDecrease();
      if (trend > 0 && colorIncrease) {
        batch.push(
          host.animate([{ color: colorIncrease }, { color: '' }], {
            duration: Math.max(d, 400),
            easing: 'ease-out',
            fill: 'none',
          }),
        );
      } else if (trend < 0 && colorDecrease) {
        batch.push(
          host.animate([{ color: colorDecrease }, { color: '' }], {
            duration: Math.max(d, 400),
            easing: 'ease-out',
            fill: 'none',
          }),
        );
      }
    }

    this.prevNumericValue = newNumericValue;

    if (batch.length === 0) {
      return;
    }

    this._live.push(...batch);
    this.animCount++;
    this.animationsStart.emit();

    Promise.allSettled(batch.map((a) => a.finished)).then(() => {
      const batchSet = new Set(batch);
      this._live = this._live.filter((a) => !batchSet.has(a));
      this.animCount--;

      if (this.animCount === 0 && !this._destroyed) {
        this.animationsFinish.emit();
      }
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private getDigitValue(key: string): number {
    const part = [...this.data().integer, ...this.data().fraction].find((p) => p.key === key);
    return part ? this.getPartDigitValue(part) : 0;
  }

  private getPartDigitValue(part: { value: string; numericValue?: number }): number {
    return part.numericValue ?? Number(part.value);
  }

  private resolveTrend(oldValue: number, newValue: number): number {
    const configured = this.trend();
    const trend =
      typeof configured === 'function'
        ? configured(oldValue, newValue)
        : (configured ?? Math.sign(newValue - oldValue));
    return Math.sign(trend);
  }

  private getContinuousStartPos(): number | undefined {
    const current = new Map<string, number>();
    const currentOrder: string[] = [];

    untracked(() => {
      [...this.data().integer, ...this.data().fraction].forEach((p) => {
        if (p.type === 'integer' || p.type === 'fraction') {
          current.set(p.key, this.getPartDigitValue(p));
          currentOrder.push(p.key);
        }
      });
    });

    const firstChangedPrev = this.prevDigitOrder.find(
      (key) => current.get(key) !== this.prevDigitValues.get(key),
    );
    const firstChangedCurrent = currentOrder.find(
      (key) => current.get(key) !== this.prevDigitValues.get(key),
    );

    const start = Math.max(
      this.getDigitPosition(firstChangedPrev) ?? -Infinity,
      this.getDigitPosition(firstChangedCurrent) ?? -Infinity,
    );
    return Number.isFinite(start) ? start : undefined;
  }

  private getDigitPosition(key?: string): number | undefined {
    if (!key) return undefined;
    if (key.startsWith('i')) return Number(key.slice(1));
    if (key.startsWith('f')) return -Number(key.slice(1));
    return undefined;
  }

  private getDigitLength(key: string): number {
    if (!key.startsWith('i')) return 10;
    const position = Number(key.slice(1));
    const max = this.digits()[position]?.max;
    return max !== undefined ? max + 1 : 10;
  }

  protected digitLengthForKey(key: string): number {
    return this.getDigitLength(key);
  }

  protected digitGlyphsForKey(key: string): { value: number; glyph: string }[] {
    return this.digitGlyphs().slice(0, this.getDigitLength(key));
  }

  private addStaggerDelay(
    options: KeyframeAnimationOptions,
    staggerDelay: number,
  ): KeyframeAnimationOptions {
    const currentDelay = typeof options.delay === 'number' ? options.delay : 0;
    return { ...options, delay: currentDelay + staggerDelay };
  }

  private getTrendDelta(from: number, to: number, trend: number, length = 10): number {
    const diff = to - from;
    const t = trend || Math.sign(diff);
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
    const cs = getComputedStyle(host);
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
      ghost.querySelectorAll<HTMLElement>('[inert]').forEach((el) => {
        el.style.display = 'none';
      });
    }
    return ghost;
  }
}
