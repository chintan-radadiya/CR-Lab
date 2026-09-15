# Prism Study

One visual identity, two coordinated appearances. Light mode uses a warm ivory canvas and ink typography; dark mode uses soft ink surfaces. Both retain a contrasting deep-teal study banner and a restrained mix of mint, coral, gold, and violet.

## Component rules

- Teal identifies the main action and argument-evaluation skills.
- Coral distinguishes argument-analysis skills and the focused-practice route.
- Gold distinguishes deduction, timing, and revisit actions.
- Violet distinguishes application skills and accuracy summaries.
- Correct, incorrect, and warning states use semantic tokens and explicit text/icons; color is never the only signal.
- Reading areas use quieter surfaces. Reserve stronger colors for headings, navigation, selected options, and compact status markers.
- Decorative dashboard artwork is not a performance chart. All numerical metrics come from actual saved attempts.

## Implementation

`css/app.css` contains shared layout/component rules with palette values in `:root` and `[data-theme="dark"]`. Add colors through tokens, not inline light/dark overrides. Local SVGs in `js/icons.js` inherit `currentColor`; decorative illustration colors are intentionally shared by both modes.

`js/theme.js` runs in the document head before the stylesheet. It resolves Light, Dark, or Auto (the operating-system preference), persists the choice under `cr_practice_theme_v1`, and updates CSS without rerendering the current question. This setting is independent of practice history and is retained when progress is cleared.

## Verification

Run `npm test` and `npm run test:browser`. Browser checks cover both palettes, operating-system changes, persisted preference, mobile overflow, sampled normal-text contrast, and preserving live answers, timers, and unsaved notes while switching modes. Respect reduced-motion settings and retain visible keyboard focus when extending components.
