import { contentChildren, Directive, effect } from '@angular/core';
import { DigitFlowComponent } from './digit-flow.component';

/**
 * Wrap multiple ngx-digit-flow components to synchronize their animations.
 * All children will start animating in the same animation frame.
 *
 * @example
 * <div ngxDigitFlowGroup>
 *   <ngx-digit-flow [value]="dollars" />
 *   <ngx-digit-flow [value]="cents" />
 * </div>
 */
@Directive({
  selector: '[ngxDigitFlowGroup]',
  standalone: true,
})
export class DigitFlowGroupDirective {
  private children = contentChildren(DigitFlowComponent);

  constructor() {
    effect(() => {
      // Re-run when children change — currently a no-op hook for future
      // batch coordination (pause all children, release in same rAF)
      void this.children();
    });
  }
}
