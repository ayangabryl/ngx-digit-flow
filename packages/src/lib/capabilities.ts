export interface DigitFlowCapabilityOptions {
  respectMotionPreference?: boolean;
}

export function canAnimateDigitFlow(options: DigitFlowCapabilityOptions = {}): boolean {
  if (typeof window === 'undefined' || typeof CSS === 'undefined') return false;
  if (options.respectMotionPreference !== false
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }

  return typeof Element !== 'undefined'
    && typeof Element.prototype.animate === 'function'
    && typeof CSS.registerProperty === 'function'
    && CSS.supports('width', 'calc(mod(2, 10) * 1px)');
}
