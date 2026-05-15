import { contentChildren, Directive, forwardRef } from '@angular/core';
import { DigitFlowComponent } from './digit-flow.component';
import {
  DIGIT_FLOW_GROUP,
  DigitFlowGroupCoordinator,
  DigitFlowGroupMember,
} from './digit-flow-group.token';

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
  providers: [
    {
      provide: DIGIT_FLOW_GROUP,
      useExisting: forwardRef(() => DigitFlowGroupDirective),
    },
  ],
})
export class DigitFlowGroupDirective implements DigitFlowGroupCoordinator {
  private children = contentChildren(DigitFlowComponent, { descendants: true });
  private pendingUpdates = new Map<DigitFlowGroupMember, () => void>();
  private flushQueued = false;

  requestGroupedUpdate(member: DigitFlowGroupMember, applyUpdate: () => void): boolean {
    if (!member.canGroupAnimateNow()) return false;

    this.pendingUpdates.set(member, applyUpdate);
    if (!this.flushQueued) {
      this.flushQueued = true;
      queueMicrotask(() => this.flushGroupedUpdates());
    }

    return true;
  }

  private flushGroupedUpdates(): void {
    this.flushQueued = false;
    if (this.pendingUpdates.size === 0) return;

    const members = this.children().filter((child) => child.canGroupAnimateNow());

    for (const member of members) {
      member.prepareGroupedUpdate();
    }

    for (const applyUpdate of this.pendingUpdates.values()) {
      applyUpdate();
    }
    this.pendingUpdates.clear();

    for (const member of members) {
      member.queueGroupedAnimation();
    }
  }
}
