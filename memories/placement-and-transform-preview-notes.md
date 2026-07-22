# Placement and transform previews

- `DefaultPlacementService` and `AbsolutePlacementService` divide preview movement by the element's CSS `zoom` before composing `translate(...)`; the final placement commit remains in layout units.
- `getBoxQuads` composes zoom as `zoom * transform`, so transform translations are scaled the same way as browser rendering.
- `TransformOriginExtension` includes self zoom when drawing its overlay, but pointer-up converts to element-local coordinates so authored `transform-origin` remains in local units.
- Direct `element.style.transform` previews must be reconciled after commit: restore the persisted local inline transform, or clear the preview when the value is stylesheet-backed.
