# Changelog

## 0.0.8 - 2026-05-15

### Added

- Added real `DigitFlowGroupDirective` batching so related counters snapshot together and unchanged siblings can animate layout shifts caused by another grouped value.
- Added test coverage for grouped layout-shift animation behavior.

### Changed

- Split the demo page into standard Angular `templateUrl` and `styleUrl` files.
- Updated the docs group preview to show a clearer scoreboard width-shift example.
- Updated README, package README, site docs, and the bundled agent skill for the current group behavior.

### Fixed

- Fixed the Vercel production build failure by reducing the demo page component stylesheet below the `anyComponentStyle` error budget.
- Avoided expensive DOM snapshot work for hidden, reduced-motion, non-animated, or far-offscreen digit-flow updates while still updating displayed values.

## 0.0.7 - 2026-05-15

### Changed

- Reduced mobile demo page animation load by pausing live demo card updates while cards are outside the viewport.
- Skipped digit-flow animation work for hidden or far-offscreen hosts while still updating the displayed value.
- Updated the site GitHub header control to load its star count from the GitHub API instead of hardcoding the value.
- Clarified trend documentation around digit path behavior and improved the Trend demo labels.

## 0.0.6 - 2026-05-15

### Changed

- Removed external project references from package metadata, site footer, changelog wording, code comments, tests, and the bundled agent skill.
- Updated package keywords so `ngx-digit-flow` is described independently.

## 0.0.5 - 2026-05-15

### Added

- Added `spinEasing="overshoot"` and `flipEasing="overshoot"` named easing presets while keeping raw CSS easing strings supported.
- Added `DigitFlowEasing` to the public API.
- Added changelog coverage for release notes.

### Changed

- Reworked the animation engine around reel-based WAAPI primitives:
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
