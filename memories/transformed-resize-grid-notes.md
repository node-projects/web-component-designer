# Transformed resize and grid interactions

- Resize and grid logic converts canvas/overlay points into element-local coordinates instead of deriving deltas from axis-aligned rectangles or an element-only inverse matrix.
- Left/top resize handles measure movement in the initial local-axis basis. Using the element's changing local space cancels part of the delta as its origin moves.
- Opposite-corner correction converts the current local fixed anchor back to canvas/parent space. Avoid rereading live `getBoxQuads()` in the same pointer-move turn because layout may still expose the previous box.
- Grid helpers keep local cell/gap coordinates separate from overlay coordinates so placement, hover, and track resizing share transform-safe hit testing.
