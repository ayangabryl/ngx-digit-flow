export interface DigitFlowCapabilityOptions {
  respectMotionPreference?: boolean;
}

export function canAnimateDigitFlow(options: DigitFlowCapabilityOptions = {}): boolean {
  if (typeof window === 'undefined' || typeof window.CSS === 'undefined') return false;
  if (
    options.respectMotionPreference !== false &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    return false;
  }

  return (
    typeof window.Element !== 'undefined' &&
    typeof window.Element.prototype.animate === 'function' &&
    typeof window.CSS.registerProperty === 'function' &&
    window.CSS.supports('width', 'calc(mod(2, 10) * 1px)')
  );
}
