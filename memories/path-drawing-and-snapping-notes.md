# Path drawing and snapping

- Freehand `DrawPathTool` can interpolate linear points with `interpolatePoints` and optional `interpolationDistance`; the default tool enables interpolation. Point-to-point mode remains separate so its angle snapping is unaffected.
- `PathDataPolyfill.straightenLine()` uses `calculateAlpha()`'s clockwise screen-space angle and reconstructs Y with `y - Math.sin(angle) * length`. Reversing that sign flips vertical snapping.
