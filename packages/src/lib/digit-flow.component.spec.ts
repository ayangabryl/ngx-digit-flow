import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { DigitFlowComponent } from './digit-flow.component';

interface AnimateCall {
  keyframes: PropertyIndexedKeyframes | Keyframe[];
  options?: number | KeyframeAnimationOptions;
}

let animateCalls: AnimateCall[] = [];
let holdColorAnimations = false;
let prefersReducedMotion = false;

function finishImmediatelyAnimation(): Animation {
  return {
    finished: Promise.resolve(),
    cancel: () => undefined,
  } as unknown as Animation;
}

function testAnimation(
  keyframes: PropertyIndexedKeyframes | Keyframe[],
  options?: number | KeyframeAnimationOptions,
): Animation {
  animateCalls.push({ keyframes, options });
  const colorAnimation = Array.isArray(keyframes) && keyframes.some((frame) => 'color' in frame);
  return {
    finished:
      colorAnimation && holdColorAnimations ? new Promise(() => undefined) : Promise.resolve(),
    cancel: () => undefined,
  } as unknown as Animation;
}

function mockMovingRects(): void {
  let calls = 0;
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      x: 0,
      y: 0,
      left: calls++ === 0 ? 20 : 0,
      top: 0,
      right: 30,
      bottom: 20,
      width: 10,
      height: 20,
      toJSON: () => ({}),
    }),
  });
}

describe('DigitFlowComponent', () => {
  let fixture: ComponentFixture<DigitFlowComponent>;

  function renderedValue(): string {
    const data = (
      fixture.componentInstance as unknown as {
        data: () => {
          pre: { value: string }[];
          integer: { value: string }[];
          fraction: { value: string }[];
          post: { value: string }[];
        };
      }
    ).data();

    return [...data.pre, ...data.integer, ...data.fraction, ...data.post]
      .map((part) => part.value)
      .join('');
  }

  function visibleDigitText(): string {
    return [...fixture.nativeElement.querySelectorAll('.df-digit')]
      .map(
        (digit: Element) => digit.querySelector('.df-digit__num:not([inert])')?.textContent ?? '',
      )
      .join('');
  }

  beforeEach(async () => {
    animateCalls = [];
    holdColorAnimations = false;
    prefersReducedMotion = false;

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({ matches: prefersReducedMotion }),
    });
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: testAnimation,
    });
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: 10,
        bottom: 20,
        width: 10,
        height: 20,
        toJSON: () => ({}),
      }),
    });

    await TestBed.configureTestingModule({
      imports: [DigitFlowComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DigitFlowComponent);
    fixture.componentRef.setInput('value', 0);
    fixture.componentRef.setInput('animated', true);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('keeps the exact target value at the end of a fractional continuous update', async () => {
    fixture.componentRef.setInput('continuous', true);
    fixture.componentRef.setInput('value', 2.5);
    fixture.detectChanges();

    for (let i = 0; i < 6; i++) {
      await fixture.whenStable();
      fixture.detectChanges();
    }

    expect(renderedValue()).toBe('2.5');
  });

  it('renders the initial value immediately when continuous mode is enabled on mount', async () => {
    const initialFixture = TestBed.createComponent(DigitFlowComponent);
    initialFixture.componentRef.setInput('value', 1000);
    initialFixture.componentRef.setInput('animated', true);
    initialFixture.componentRef.setInput('continuous', true);
    initialFixture.detectChanges();

    const data = (
      initialFixture.componentInstance as unknown as {
        data: () => {
          pre: { value: string }[];
          integer: { value: string }[];
          fraction: { value: string }[];
          post: { value: string }[];
        };
      }
    ).data();
    const value = [...data.pre, ...data.integer, ...data.fraction, ...data.post]
      .map((part) => part.value)
      .join('');

    expect(value).toBe('1,000');
  });

  it('continues processing continuous steps while color flash animations are still running', async () => {
    holdColorAnimations = true;
    fixture.componentRef.setInput('continuous', true);
    fixture.componentRef.setInput('colorOnIncrease', '#4ade80');
    fixture.componentRef.setInput('value', 3);
    fixture.detectChanges();

    for (let i = 0; i < 6; i++) {
      await fixture.whenStable();
      fixture.detectChanges();
    }

    expect(renderedValue()).toBe('3');
  });

  it('applies stagger delay to fade-in animations for newly inserted elements', async () => {
    fixture.componentRef.setInput('stagger', 25);
    fixture.componentRef.setInput('value', 999);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    animateCalls = [];
    fixture.componentRef.setInput('value', 1000);
    fixture.detectChanges();
    await fixture.whenStable();

    const fadeInWithDelay = animateCalls.some((call) => {
      const fadesIn =
        Array.isArray(call.keyframes) &&
        call.keyframes.length === 2 &&
        call.keyframes[0]['opacity'] === '0' &&
        call.keyframes[1]['opacity'] === '1';
      return fadesIn && typeof call.options === 'object' && (call.options.delay ?? 0) > 0;
    });

    expect(fadeInWithDelay).toBe(true);
  });

  it('renders localized digit glyphs for non-Latin numbering systems', async () => {
    fixture.componentRef.setInput('locales', 'ar-EG');
    fixture.componentRef.setInput('value', 12);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(renderedValue()).toBe('١٢');
    expect(visibleDigitText()).toBe('١٢');
  });

  it('uses a configured trend override for digit direction', async () => {
    fixture.componentRef.setInput('value', 2);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    animateCalls = [];
    fixture.componentRef.setInput('trend', -1);
    fixture.componentRef.setInput('value', 8);
    fixture.detectChanges();
    await fixture.whenStable();

    const spin = animateCalls.find(
      (call) => !Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-d']),
    );

    expect((spin?.keyframes as PropertyIndexedKeyframes)['--_df-d']).toEqual([4, 0]);
  });

  it('uses full timing inputs for spin, transform, and opacity animations', async () => {
    mockMovingRects();
    fixture.componentRef.setInput('value', 9);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    animateCalls = [];
    mockMovingRects();
    fixture.componentRef.setInput('transformTiming', { duration: 111, easing: 'linear' });
    fixture.componentRef.setInput('spinTiming', { duration: 222, easing: 'ease-in' });
    fixture.componentRef.setInput('opacityTiming', { duration: 333, easing: 'ease-out' });
    fixture.componentRef.setInput('value', 10);
    fixture.detectChanges();
    await fixture.whenStable();

    const spin = animateCalls.find(
      (call) => !Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-d']),
    );
    const transform = animateCalls.find(
      (call) =>
        Array.isArray(call.keyframes) && call.keyframes.some((frame) => 'transform' in frame),
    );
    const fade = animateCalls.find(
      (call) =>
        Array.isArray(call.keyframes) &&
        call.keyframes[0]['opacity'] === '0' &&
        call.keyframes[1]['opacity'] === '1',
    );

    expect(spin?.options).toEqual(expect.objectContaining({ duration: 222, easing: 'ease-in' }));
    expect(transform?.options).toEqual(
      expect.objectContaining({ duration: 111, easing: 'linear' }),
    );
    expect(fade?.options).toEqual(expect.objectContaining({ duration: 333, easing: 'ease-out' }));
  });

  it('uses the spring easing for spins and ease-out easing for layout FLIP by default', async () => {
    mockMovingRects();
    fixture.componentRef.setInput('value', 9);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    animateCalls = [];
    mockMovingRects();
    fixture.componentRef.setInput('value', 10);
    fixture.detectChanges();
    await fixture.whenStable();

    const spin = animateCalls.find(
      (call) => !Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-d']),
    );
    const transform = animateCalls.find(
      (call) =>
        Array.isArray(call.keyframes) && call.keyframes.some((frame) => 'transform' in frame),
    );

    expect(spin?.options).toEqual(
      expect.objectContaining({ easing: expect.stringContaining('linear(') }),
    );
    expect(transform?.options).toEqual(
      expect.objectContaining({ easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }),
    );
  });

  it('preserves user timing delays when stagger is not configured', async () => {
    mockMovingRects();
    fixture.componentRef.setInput('value', 9);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    animateCalls = [];
    mockMovingRects();
    fixture.componentRef.setInput('transformTiming', { duration: 111, delay: 40 });
    fixture.componentRef.setInput('spinTiming', { duration: 222, delay: 30 });
    fixture.componentRef.setInput('opacityTiming', { duration: 333, delay: 20 });
    fixture.componentRef.setInput('value', 10);
    fixture.detectChanges();
    await fixture.whenStable();

    const spin = animateCalls.find(
      (call) => !Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-d']),
    );
    const transform = animateCalls.find(
      (call) =>
        Array.isArray(call.keyframes) && call.keyframes.some((frame) => 'transform' in frame),
    );
    const fade = animateCalls.find(
      (call) =>
        Array.isArray(call.keyframes) &&
        call.keyframes[0]['opacity'] === '0' &&
        call.keyframes[1]['opacity'] === '1',
    );

    expect(spin?.options).toEqual(expect.objectContaining({ delay: 30 }));
    expect(transform?.options).toEqual(expect.objectContaining({ delay: 40 }));
    expect(fade?.options).toEqual(expect.objectContaining({ delay: 20 }));
  });

  it('can ignore reduced motion when respectMotionPreference is false', async () => {
    prefersReducedMotion = true;
    fixture.componentRef.setInput('respectMotionPreference', false);
    fixture.componentRef.setInput('value', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    const spin = animateCalls.find(
      (call) => !Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-d']),
    );

    expect(spin?.options).toEqual(expect.objectContaining({ duration: 900 }));
  });

  it('uses digit max config for countdown-style rolls', async () => {
    fixture.componentRef.setInput('value', 59);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    animateCalls = [];
    fixture.componentRef.setInput('digits', { 1: { max: 5 } });
    fixture.componentRef.setInput('trend', 1);
    fixture.componentRef.setInput('value', 0);
    fixture.detectChanges();
    await fixture.whenStable();

    const spinDeltas = animateCalls
      .filter((call) => !Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-d']))
      .map((call) => ((call.keyframes as PropertyIndexedKeyframes)['--_df-d'] as number[])[0]);

    expect(spinDeltas).toContain(-1);
  });

  it('passes configured digit reel length to CSS positioning', async () => {
    fixture.componentRef.setInput('digits', { 1: { max: 5 } });
    fixture.componentRef.setInput('value', 59);
    fixture.detectChanges();
    await fixture.whenStable();

    const tensDigit = fixture.nativeElement.querySelector('[data-key="i1"]') as HTMLElement;
    const renderedTensGlyphs = tensDigit.querySelectorAll('.df-digit__num');

    expect(tensDigit.style.getPropertyValue('--_df-len')).toBe('6');
    expect(renderedTensGlyphs.length).toBe(6);
  });

  it('emits finish when the last continuous step has no visible animations', async () => {
    const emitFinish = vi.spyOn(fixture.componentInstance.animationsFinish, 'emit');
    const component = fixture.componentInstance as unknown as {
      snapshot: () => void;
      runAnimations: () => void;
      _continuousNeedsFinish: boolean;
      _durationOverride: number;
      _targetDisplayValue: number;
    };

    component.snapshot();
    component._continuousNeedsFinish = true;
    component._durationOverride = 80;
    component._targetDisplayValue = 0;
    component.runAnimations();

    await Promise.resolve();
    await fixture.whenStable();

    expect(emitFinish).toHaveBeenCalledTimes(1);
  });
});
