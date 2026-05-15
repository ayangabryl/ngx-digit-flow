import { InjectionToken } from '@angular/core';

export interface DigitFlowGroupMember {
  canGroupAnimateNow(): boolean;
  prepareGroupedUpdate(): void;
  queueGroupedAnimation(): void;
}

export interface DigitFlowGroupCoordinator {
  requestGroupedUpdate(member: DigitFlowGroupMember, applyUpdate: () => void): boolean;
}

export const DIGIT_FLOW_GROUP = new InjectionToken<DigitFlowGroupCoordinator>('DIGIT_FLOW_GROUP');
