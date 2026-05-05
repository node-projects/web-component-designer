- Drag preview transforms in DefaultPlacementService and AbsolutePlacementService must divide the visual movement by the dragged element's CSS `zoom` factor before composing `translate(...)`.
- `getBoxQuads` must wrap the element transform with the zoom matrix (`zoom * transform`, not `transform * zoom`) so overlay geometry sees the same zoom-scaled translation the browser renders.
- TransformOriginExtension should draw its marker with `getResultingTransformationBetweenElementAndAllAncestors(..., canvas)` so the overlay includes self zoom, but it should keep using `element.convertPointFromNode(..., canvas)` for pointer-up commits so authored `transform-origin` stays in local element units.

- `zoom` scales transform translation during preview, but the final `placeDesignItem(..., 'position')` commit path should stay in layout units.
