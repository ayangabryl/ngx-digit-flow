import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DigitFlowComponent } from './digit-flow.component';

interface AnimateCall {
  keyframes: PropertyIndexedKeyframes | Keyframe[];
  options?: number | KeyframeAnimationOptions;
}

let animateCalls: AnimateCall[] = [];
let holdColorAnimations = false;

function finishImmediatelyAnimation(): Animation {
  return {
    finished: Promise.resolve(),
    cancel: () => undefined,
  } as unknown as Animation;
}

function testAnimation(keyframes: PropertyIndexedKeyframes | Keyframe[], options?: number | KeyframeAnimationOptions): Animation {
  animateCalls.push({ keyframes, options });
  const colorAnimation = Array.isArray(keyframes) && keyframes.some(frame => 'color' in frame);
  return {
    finished: colorAnimation && holdColorAnimations ? new Promise(() => undefined) : Promise.resolve(),
    cancel: () => undefined,
  } as unknown as Animation;
}

describe('DigitFlowComponent', () => {
  let fixture: ComponentFixture<DigitFlowComponent>;

  function renderedValue(): string {
    const data = (fixture.componentInstance as unknown as {
      data: () => {
        pre: { value: string }[];
        integer: { value: string }[];
        fraction: { value: string }[];
        post: { value: string }[];
      };
    }).data();

    return [...data.pre, ...data.integer, ...data.fraction, ...data.post]
      .map(part => part.value)
      .join('');
  }

  beforeEach(async () => {
    animateCalls = [];
    holdColorAnimations = false;

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({ matches: false }),
    });
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: testAnimation,
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

    const data = (initialFixture.componentInstance as unknown as {
      data: () => {
        pre: { value: string }[];
        integer: { value: string }[];
        fraction: { value: string }[];
        post: { value: string }[];
      };
    }).data();
    const value = [...data.pre, ...data.integer, ...data.fraction, ...data.post]
      .map(part => part.value)
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

    const fadeInWithDelay = animateCalls.some(call => {
      const fadesIn = Array.isArray(call.keyframes)
        && call.keyframes.length === 2
        && call.keyframes[0]['opacity'] === '0'
        && call.keyframes[1]['opacity'] === '1';
      return fadesIn
        && typeof call.options === 'object'
        && (call.options.delay ?? 0) > 0;
    });

    expect(fadeInWithDelay).toBe(true);
  });
});
