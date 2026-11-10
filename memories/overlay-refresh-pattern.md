# Overlay refresh pattern

- Designer extensions should pass existing SVG nodes back into `_drawLine`, `_drawCircle`, and `_drawPath`, and gate refresh work with `_valuesHaveChanges`.
- Rebuild overlays only when their structure changes, such as segment count/type or control-point presence. Updating existing nodes preserves pointer capture and avoids stale handles.
- Quads use the canvas host's border-box origin. If `:host` (or patched `:root`) moves that host with margins, `fillCalculationrects()` aligns the separate overlay layer and normalized pointer/element coordinates to that origin. The translation uses screen pixels so it remains correct under zoom and pan. Both native Firefox and Chromium's polyfill require this designer adjustment; do not compensate inside getBoxQuads.
- `npm run test:canvas-root-margin` checks live stylesheet edits, positive/negative margins, padding, pan, and 50/100/200% zoom in Chromium and Firefox. Install its browsers with `npx playwright install chromium firefox`.
