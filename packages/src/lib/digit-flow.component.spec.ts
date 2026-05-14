import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DigitFlowComponent } from './digit-flow.component';

interface AnimateCall {
  keyframes: PropertyIndexedKeyframes | Keyframe[];
  options?: number | KeyframeAnimationOptions;
}

let animateCalls: AnimateCall[] = [];
let holdColorAnimations = false;
let holdAllAnimations = false;
let prefersReducedMotion = false;
let linearEasingSupported = true;
let heldAnimationResolvers: (() => void)[] = [];

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
  const isLinearCapabilityProbe =
    !Array.isArray(keyframes) &&
    keyframes['opacity'] === 0 &&
    typeof options === 'object' &&
    options.easing === 'linear(0, 1)';

  if (isLinearCapabilityProbe) {
    if (!linearEasingSupported) {
      throw new Error('linear() easing is not supported');
    }
    return finishImmediatelyAnimation();
  }

  animateCalls.push({ keyframes, options });
  const colorAnimation = Array.isArray(keyframes) && keyframes.some((frame) => 'color' in frame);
  return {
    finished:
      holdAllAnimations || (colorAnimation && holdColorAnimations)
        ? new Promise<void>((resolve) => heldAnimationResolvers.push(resolve))
        : Promise.resolve(),
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
    holdAllAnimations = false;
    prefersReducedMotion = false;
    linearEasingSupported = true;
    heldAnimationResolvers = [];

    const cssMock = {
      registerProperty: () => undefined,
      supports: () => true,
    };
    Object.defineProperty(window, 'CSS', {
      configurable: true,
      value: cssMock,
    });
    Object.defineProperty(globalThis, 'CSS', {
      configurable: true,
      value: cssMock,
    });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({ matches: prefersReducedMotion }),
    });
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: testAnimation,
    });
    Object.defineProperty(Element.prototype, 'animate', {
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

  it('uses a single continuous animation where unchanged lower digits loop once', async () => {
    fixture.componentRef.setInput('value', 120);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    animateCalls = [];
    fixture.componentRef.setInput('continuous', true);
    fixture.componentRef.setInput('value', 140);
    fixture.detectChanges();
    await fixture.whenStable();

    const spinDeltas = animateCalls
      .filter((call) => !Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-d']))
      .map((call) => ((call.keyframes as PropertyIndexedKeyframes)['--_df-d'] as number[])[0]);

    expect(renderedValue()).toBe('140');
    expect(spinDeltas).toEqual(expect.arrayContaining([-2, -10]));
  });

  it('spins newly inserted digits from zero like number-flow', async () => {
    fixture.componentRef.setInput('value', 0);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    animateCalls = [];
    fixture.componentRef.setInput('continuous', true);
    fixture.componentRef.setInput('value', 12);
    fixture.detectChanges();
    await fixture.whenStable();

    const spinDeltas = animateCalls
      .filter((call) => !Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-d']))
      .map((call) => ((call.keyframes as PropertyIndexedKeyframes)['--_df-d'] as number[])[0]);

    expect(spinDeltas).toEqual(expect.arrayContaining([-1, -2]));
  });

  it('loops unchanged digits below the first changed position', async () => {
    fixture.componentRef.setInput('value', 100);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    animateCalls = [];
    fixture.componentRef.setInput('continuous', true);
    fixture.componentRef.setInput('value', 205);
    fixture.detectChanges();
    await fixture.whenStable();

    const spinDeltas = animateCalls
      .filter((call) => !Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-d']))
      .map((call) => ((call.keyframes as PropertyIndexedKeyframes)['--_df-d'] as number[])[0]);

    expect(spinDeltas).toEqual(expect.arrayContaining([-1, -5, -10]));
  });

  it('does not loop unchanged lower digits when continuous mode is disabled', async () => {
    fixture.componentRef.setInput('value', 120);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    animateCalls = [];
    fixture.componentRef.setInput('value', 140);
    fixture.detectChanges();
    await fixture.whenStable();

    const spinDeltas = animateCalls
      .filter((call) => !Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-d']))
      .map((call) => ((call.keyframes as PropertyIndexedKeyframes)['--_df-d'] as number[])[0]);

    expect(spinDeltas).toEqual([-2]);
  });

  it('keeps continuous mode on one render pass while color flash animations are still running', async () => {
    holdColorAnimations = true;
    fixture.componentRef.setInput('continuous', true);
    fixture.componentRef.setInput('colorOnIncrease', '#4ade80');
    fixture.componentRef.setInput('value', 30);
    fixture.detectChanges();

    await fixture.whenStable();

    expect(renderedValue()).toBe('30');
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
        !Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-d-opacity']);
      return fadesIn && typeof call.options === 'object' && (call.options.delay ?? 0) > 0;
    });

    expect(fadeInWithDelay).toBe(true);
  });

  it('applies stagger delay to fade-out animations for exiting elements', async () => {
    fixture.componentRef.setInput('stagger', 25);
    fixture.componentRef.setInput('value', 1000);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    animateCalls = [];
    fixture.componentRef.setInput('value', 9);
    fixture.detectChanges();
    await fixture.whenStable();

    const fadeOutWithDelay = animateCalls.some((call) => {
      const fadesOut =
        !Array.isArray(call.keyframes) &&
        Array.isArray(call.keyframes['--_df-d-opacity']) &&
        (call.keyframes['--_df-d-opacity'] as number[])[0] > 0;
      return fadesOut && typeof call.options === 'object' && (call.options.delay ?? 0) > 0;
    });

    expect(fadeOutWithDelay).toBe(true);
  });

  it('does not stagger core spin or layout animations', async () => {
    mockMovingRects();
    fixture.componentRef.setInput('value', 99);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    animateCalls = [];
    mockMovingRects();
    fixture.componentRef.setInput('stagger', 25);
    fixture.componentRef.setInput('value', 100);
    fixture.detectChanges();
    await fixture.whenStable();

    const coreAnimations = animateCalls.filter(
      (call) =>
        (!Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-d'])) ||
        (!Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-dx'])) ||
        (Array.isArray(call.keyframes) && call.keyframes.some((frame) => 'transform' in frame)),
    );

    expect(coreAnimations.length).toBeGreaterThan(0);
    expect(
      coreAnimations.every(
        (call) => typeof call.options !== 'object' || (call.options.delay ?? 0) === 0,
      ),
    ).toBe(true);
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
        (Array.isArray(call.keyframes) && call.keyframes.some((frame) => 'transform' in frame)) ||
        (!Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-dx'])),
    );
    const fade = animateCalls.find(
      (call) => !Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-d-opacity']),
    );

    expect(spin?.options).toEqual(expect.objectContaining({ duration: 222, easing: 'ease-in' }));
    expect(transform?.options).toEqual(
      expect.objectContaining({ duration: 111, easing: 'linear' }),
    );
    expect(fade?.options).toEqual(expect.objectContaining({ duration: 333, easing: 'ease-out' }));
  });

  it('uses the spring easing for spins and layout FLIP by default', async () => {
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
        (Array.isArray(call.keyframes) && call.keyframes.some((frame) => 'transform' in frame)) ||
        (!Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-dx'])),
    );

    expect(spin?.options).toEqual(
      expect.objectContaining({ easing: expect.stringContaining('linear(') }),
    );
    expect(transform?.options).toEqual(
      expect.objectContaining({ easing: expect.stringContaining('linear(') }),
    );
  });

  it('resolves named easing presets for spin and layout animations', async () => {
    mockMovingRects();
    fixture.componentRef.setInput('value', 9);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    animateCalls = [];
    mockMovingRects();
    fixture.componentRef.setInput('spinEasing', 'overshoot');
    fixture.componentRef.setInput('flipEasing', 'overshoot');
    fixture.componentRef.setInput('value', 10);
    fixture.detectChanges();
    await fixture.whenStable();

    const spin = animateCalls.find(
      (call) => !Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-d']),
    );
    const transform = animateCalls.find(
      (call) =>
        (Array.isArray(call.keyframes) && call.keyframes.some((frame) => 'transform' in frame)) ||
        (!Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-dx'])),
    );

    expect(spin?.options).toEqual(
      expect.objectContaining({ easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }),
    );
    expect(transform?.options).toEqual(
      expect.objectContaining({ easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }),
    );
  });

  it('keeps the default opacity timing at 450ms like number-flow', async () => {
    fixture.componentRef.setInput('duration', 1200);
    fixture.componentRef.setInput('value', 9);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    animateCalls = [];
    fixture.componentRef.setInput('value', 10);
    fixture.detectChanges();
    await fixture.whenStable();

    const fade = animateCalls.find(
      (call) => !Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-d-opacity']),
    );

    expect(fade?.options).toEqual(expect.objectContaining({ duration: 450 }));
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
        (Array.isArray(call.keyframes) && call.keyframes.some((frame) => 'transform' in frame)) ||
        (!Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-dx'])),
    );
    const fade = animateCalls.find(
      (call) => !Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-d-opacity']),
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

  it('animates the number container with accumulated dx and width deltas', async () => {
    mockMovingRects();
    fixture.componentRef.setInput('value', 9);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    animateCalls = [];
    mockMovingRects();
    fixture.componentRef.setInput('value', 1000);
    fixture.detectChanges();
    await fixture.whenStable();

    const container = animateCalls.find(
      (call) =>
        !Array.isArray(call.keyframes) &&
        Array.isArray(call.keyframes['--_df-dx']) &&
        Array.isArray(call.keyframes['--_df-d-width']),
    );

    expect(container?.options).toEqual(expect.objectContaining({ composite: 'accumulate' }));
  });

  it('uses accumulated opacity delta for entering and exiting parts', async () => {
    fixture.componentRef.setInput('value', 9);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    animateCalls = [];
    fixture.componentRef.setInput('value', 10);
    fixture.detectChanges();
    await fixture.whenStable();

    const opacityDelta = animateCalls.find(
      (call) => !Array.isArray(call.keyframes) && Array.isArray(call.keyframes['--_df-d-opacity']),
    );

    expect(opacityDelta?.options).toEqual(expect.objectContaining({ composite: 'accumulate' }));
  });

  it('does not emit duplicate start events during interrupted animation batches', async () => {
    holdAllAnimations = true;
    let starts = 0;
    fixture.componentInstance.animationsStart.subscribe(() => starts++);

    fixture.componentRef.setInput('value', 1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentRef.setInput('value', 2);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(starts).toBe(1);
  });

  it('emits finish when an older interrupted batch resolves after a newer shorter batch', async () => {
    let finishes = 0;
    fixture.componentInstance.animationsFinish.subscribe(() => finishes++);

    holdAllAnimations = true;
    fixture.componentRef.setInput('value', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    holdAllAnimations = false;
    fixture.componentRef.setInput('value', 2);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();

    expect(finishes).toBe(0);

    heldAnimationResolvers.forEach((resolve) => resolve());
    await fixture.whenStable();
    await Promise.resolve();

    expect(finishes).toBe(1);
  });

  it('skips animations while the document is hidden', async () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });

    fixture.componentRef.setInput('value', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(animateCalls.length).toBe(0);
  });

  it('skips animations when linear() easing cannot be animated', async () => {
    linearEasingSupported = false;

    fixture.componentRef.setInput('value', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(animateCalls.length).toBe(0);
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
});
