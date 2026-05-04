- For resize and grid interactions under transformed elements or transformed ancestors, do not derive local deltas from axis-aligned rects or an element-only inverse matrix.
- Convert canvas/overlay points back into element-local coordinates with convertPointFromNode (via the getBoxQuads polyfill), then compute size deltas, grid cell hits, and grid track drags from those local points.
- Grid helpers should expose local cell/gap coordinates separately from overlay coordinates so placement, hover, and resize logic all share the same transform-safe hit-testing path.
- During live resize, getBoxQuads can still reflect the pre-resize box inside the same pointermove turn; for opposite-corner correction, convert the current local fixed-anchor point back to canvas instead of rereading the current quad.

