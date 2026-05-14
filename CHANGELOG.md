# Changelog

## 0.0.5 - 2026-05-15

### Added

- Added `spinEasing="overshoot"` and `flipEasing="overshoot"` named easing presets while keeping raw CSS easing strings supported.
- Added `DigitFlowEasing` to the public API.
- Added changelog coverage for release notes.

### Changed

- Reworked the animation engine to more closely match number-flow's primitives:
  - one WAAPI animation per digit update,
  - accumulated CSS custom-property deltas,
  - spring timing for spin and layout motion,
  - opacity delta animations for presence,
  - container width/translate accumulation,
  - and visual continuous mode instead of queued intermediate DOM states.
- Updated `continuous` so unchanged lower-position digits loop a full reel, creating the visual ticker effect without stepping through intermediate values in JavaScript.
- Updated `stagger` behavior so it only delays entering and exiting presence animations. Core digit spin and layout motion stay synchronized.
- Improved browser capability checks, including real WAAPI `linear(...)` easing support.
- Updated docs and the bundled agent skill to recommend the current best-practice API.

### Fixed

- Fixed `animationsFinish` so it still emits after interrupted animation batches settle out of order.
- Fixed fade-out stagger support for exiting elements.
- Fixed custom digit reel lengths so CSS reel length and JavaScript delta math stay aligned.
- Fixed default spin easing application and named easing resolution.
- Removed stale reduced-motion duration branches after the capability guard.
