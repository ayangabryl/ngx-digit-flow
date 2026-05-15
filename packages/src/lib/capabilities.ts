export interface DigitFlowCapabilityOptions {
  respectMotionPreference?: boolean;
}

// WAAPI / CSS feature detection is static — check once per page load.
let _staticCapable: boolean | undefined;

function isStaticallyCapable(): boolean {
  if (_staticCapable !== undefined) return _staticCapable;
  _staticCapable =
    typeof window !== 'undefined' &&
    typeof window.CSS !== 'undefined' &&
    typeof window.Element !== 'undefined' &&
    typeof window.Element.prototype.animate === 'function' &&
    typeof window.CSS.registerProperty === 'function' &&
    window.CSS.supports('width', 'calc(mod(2, 10) * 1px)') &&
    supportsLinearEasing();
  return _staticCapable;
}

// prefers-reduced-motion can change at runtime (OS accessibility toggle).
// Cache the result and update it only when the media query fires a change event.
let _prefersReducedMotion: boolean | undefined;

function getPrefersReducedMotion(): boolean {
  if (_prefersReducedMotion !== undefined) return _prefersReducedMotion;
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  _prefersReducedMotion = mq.matches;
  mq.addEventListener('change', (e) => {
    _prefersReducedMotion = e.matches;
  });
  return _prefersReducedMotion;
}

export function canAnimateDigitFlow(options: DigitFlowCapabilityOptions = {}): boolean {
  if (!isStaticallyCapable()) return false;
  if (options.respectMotionPreference !== false && getPrefersReducedMotion()) return false;
  return true;
}

function supportsLinearEasing(): boolean {
  try {
    document.createElement('div').animate({ opacity: 0 }, { easing: 'linear(0, 1)' });
    return true;
  } catch {
    return false;
  }
}
