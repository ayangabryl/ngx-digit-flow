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
import { EMPTY_FORMATTED, FormattedNumber } from './digit-flow.types';
import { formatToData } from './formatter';

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
  value           = input.required<number>();
  format          = input<Intl.NumberFormatOptions>({});
  locales         = input<string | string[] | undefined>(undefined);
  prefix          = input<string>('');
  suffix          = input<string>('');
  animated        = input<boolean>(true);
  duration        = input<number>(900);
  opacityDuration = input<number>(150);

  animationsStart  = output<void>();
  animationsFinish = output<void>();

  protected data    = signal<FormattedNumber>(EMPTY_FORMATTED);
  // 0–9: no guard reel needed — CSS mod() handles infinite wrapping
  protected numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  protected formattedPlainText = computed(() =>
    new Intl.NumberFormat(this.locales(), this.format()).format(this.value())
  );

  private platformId      = inject(PLATFORM_ID);
  private elRef           = inject(ElementRef<HTMLElement>);
  private destroyRef      = inject(DestroyRef);

  // Snapshot state — captured BEFORE each re-render
  private prevRects       = new Map<string, DOMRect>();
  private prevInnerHTML   = new Map<string, string>();
  private prevDigitD      = new Map<string, string>(); // --_df-d at snapshot
  private prevDigitCurrent = new Map<string, string>(); // --_df-current at snapshot
  private prevDigitValues = new Map<string, number>();  // digit value before update
  private prevNumericValue = 0;                          // full number before update

  // Animation bookkeeping
  private animCount      = 0;
  private _pending       = false;
  private _destroyed     = false;
  private _live: Animation[] = [];
  // Per-digit spin animation ref-count for .is-spinning lifecycle
  private _spinCount     = new Map<HTMLElement, number>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this._destroyed = true;
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
  // Called BEFORE Angular re-renders so we capture current DOM positions/values.

  private snapshot(): void {
    const host = this.elRef.nativeElement as HTMLElement;
    this.prevRects.clear();
    this.prevInnerHTML.clear();
    this.prevDigitD.clear();
    this.prevDigitCurrent.clear();
    this.prevDigitValues.clear();

    // NOTE: prevNumericValue is intentionally NOT updated here.
    // It holds the last value that was animated TO (set at end of runAnimations).
    // Reading this.value() here would give the NEW value (effect already read it).

    // Capture old digit values from current data signal (before it's updated)
    untracked(() => {
      [...this.data().integer, ...this.data().fraction].forEach(p => {
        if (p.type === 'integer' || p.type === 'fraction') {
          this.prevDigitValues.set(p.key, parseInt(p.value, 10));
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
    const host    = this.elRef.nativeElement as HTMLElement;
    const dur     = this.duration();
    const opDur   = this.opacityDuration();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const d       = reduced ? 0 : dur;
    const od      = reduced ? 0 : opDur;

    // Trend: +1 if number went up, -1 if down, 0 if same.
    // All digits scroll in this direction (matching an odometer).
    const newNumericValue = untracked(() => this.value());
    const trend = Math.sign(newNumericValue - this.prevNumericValue);

    const spinOpts: KeyframeAnimationOptions = {
      duration: d, easing: SPIN_EASING, fill: 'none', composite: 'accumulate',
    };
    const flipOpts: KeyframeAnimationOptions = {
      duration: d, easing: FLIP_EASING, fill: 'none', composite: 'accumulate',
    };
    const fadeOpts: KeyframeAnimationOptions = {
      duration: od, easing: 'ease-out', fill: 'both', composite: 'replace',
    };

    const batch: Animation[] = [];
    const newKeys = new Set<string>();

    host.querySelectorAll<HTMLElement>('[data-key]').forEach(el => {
      const key     = el.getAttribute('data-key')!;
      newKeys.add(key);
      const newRect  = el.getBoundingClientRect();
      const prevRect = this.prevRects.get(key);

      if (el.classList.contains('df-digit')) {
        const digit     = this.getDigitValue(key);
        const fromDigit = this.prevDigitValues.has(key)
                            ? this.prevDigitValues.get(key)!
                            : digit;
        const delta = this.getTrendDelta(fromDigit, digit, trend);

        if (delta !== 0 && d > 0) {
          // Add .is-spinning so CSS shows all digit__num spans as abs-positioned
          this.incrementSpin(el);
          const a = el.animate(
            { '--_df-d': [-delta, 0] } as PropertyIndexedKeyframes,
            spinOpts
          );
          batch.push(a);
          a.finished
            .then(() => this.decrementSpin(el))
            .catch(() => this.decrementSpin(el));
        }

        // FLIP: horizontal shift when digit count changes (e.g. 99 → 100)
        if (prevRect) {
          const dx = prevRect.left - newRect.left;
          if (Math.abs(dx) > 0.5) {
            batch.push(el.animate(
              [{ transform: `translateX(${dx}px)` }, { transform: 'translateX(0)' }],
              flipOpts
            ));
          }
        } else {
          batch.push(el.animate([{ opacity: '0' }, { opacity: '1' }], fadeOpts));
        }

      } else {
        // Separator / literal: FLIP or fade in
        if (prevRect) {
          const dx = prevRect.left - newRect.left;
          if (Math.abs(dx) > 0.5) {
            batch.push(el.animate(
              [{ transform: `translateX(${dx}px)` }, { transform: 'translateX(0)' }],
              flipOpts
            ));
          }
        } else {
          batch.push(el.animate([{ opacity: '0' }, { opacity: '1' }], fadeOpts));
        }
      }
    });

    // Ghost exits for removed elements
    this.prevRects.forEach((rect, key) => {
      if (newKeys.has(key)) return;
      const ghost = this.buildGhost(key, rect, host);
      host.appendChild(ghost);
      const a = ghost.animate([{ opacity: '1' }, { opacity: '0' }], { ...fadeOpts });
      batch.push(a);
      a.finished.then(() => ghost.remove()).catch(() => ghost.remove());
    });

    // Record value we just animated TO — used as "previous" for next run's trend
    this.prevNumericValue = newNumericValue;

    if (batch.length === 0) return;

    this._live.push(...batch);
    this.animCount++;
    this.animationsStart.emit();

    Promise.allSettled(batch.map(a => a.finished)).then(() => {
      const batchSet = new Set(batch);
      this._live = this._live.filter(a => !batchSet.has(a));
      this.animCount--;
      if (this.animCount === 0 && !this._destroyed) {
        this.animationsFinish.emit();
      }
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private getDigitValue(key: string): number {
    const part = [...this.data().integer, ...this.data().fraction].find(p => p.key === key);
    return part ? parseInt(part.value, 10) : 0;
  }

  /**
   * Trend-aware delta on a 0–(length-1) reel.
   *
   * Positive trend → forward scroll (digits count up through 0→9→0…)
   * Negative trend → backward scroll (digits count down through 0→9→8…)
   *
   * Falls back to shortest path when trend === 0 (value unchanged overall).
   *
   * Examples (length=10, trend=+1): 8→2 = +4 (8,9,0,1,2)
   * Examples (length=10, trend=-1): 2→8 = -4 (2,1,0,9,8)
   */
  private getTrendDelta(from: number, to: number, trend: number): number {
    const length = 10;
    const diff   = to - from;
    const t      = trend || Math.sign(diff); // fall back to shortest for zero-trend
    if (t > 0 && to < from) return length - from + to;   // wrap forward: e.g. 8→2 = +4
    if (t < 0 && to > from) return to - length - from;   // wrap backward: e.g. 2→8 = -4
    return diff;
  }

  // .is-spinning ref-count per digit element
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
      // Restore CSS variable state so digit ghosts show the right digit
      const savedD = this.prevDigitD.get(key);
      const savedC = this.prevDigitCurrent.get(key);
      if (savedD !== undefined) ghost.style.setProperty('--_df-d', savedD);
      if (savedC !== undefined) ghost.style.setProperty('--_df-current', savedC);
      // Ghost has no .df-digit class, so the CSS rule that hides inert digit__nums
      // doesn't apply. Explicitly hide them so only the current digit shows.
      ghost.querySelectorAll<HTMLElement>('[inert]').forEach(el => {
        el.style.display = 'none';
      });
    }
    return ghost;
  }
}
