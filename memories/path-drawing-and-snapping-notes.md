# Path drawing and snapping

- Freehand `DrawPathTool` can interpolate linear points with `interpolatePoints` and optional `interpolationDistance`; the default tool enables interpolation. Point-to-point mode remains separate so its angle snapping is unaffected. Hosts can disable freehand with `freehand: false`, for example for fences.
- `PathDataPolyfill.straightenLine()` uses `calculateAlpha()`'s clockwise screen-space angle and reconstructs Y with `y - Math.sin(angle) * length`. Reversing that sign flips vertical snapping.

- Path drawing supports click-to-place nodes and drag-to-sketch. Double-click or Enter finishes an open path, clicking the first node closes it, Backspace removes the last provisional node, and Escape cancels. Active tools receive native double-click events through the canvas.
- SVG point guides snap independently to nearby axes, straight-edge midpoints and shape centers in canvas coordinates, using a screen-space tolerance. Shift constrains drawing to angles and node drags to an axis; Alt bypasses snapping. Guides are transient and cleared when finishing, cancelling or changing tools.
- All drawing tools use `SvgDrawingHelper` to inherit paint, group insertion for undo, select the resulting object or painted geometry according to host mode, and create a viewBox before host normalization. Dash presets scale with stroke width.
