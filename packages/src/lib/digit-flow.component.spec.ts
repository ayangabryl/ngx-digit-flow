import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DigitFlowComponent } from './digit-flow.component';

function finishImmediatelyAnimation(): Animation {
  return {
    finished: Promise.resolve(),
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
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({ matches: false }),
    });
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: finishImmediatelyAnimation,
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
});
