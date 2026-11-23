# Placement and transform previews

- `DefaultPlacementService` and `AbsolutePlacementService` divide preview movement by the element's CSS `zoom` before composing `translate(...)`; the final placement commit remains in layout units.
- `getBoxQuads` composes zoom as `zoom * transform`, so transform translations are scaled the same way as browser rendering.
- `TransformOriginExtension` includes self zoom when drawing its overlay, but pointer-up converts to element-local coordinates so authored `transform-origin` remains in local units.
- Freeze the rendered computed transform and original inline value/priority at placement start. Both default and absolute placement compose each temporary translation with that frozen baseline, including runtime-derived and stylesheet transforms absent from the DesignItem style map. Share the baseline across placement-service handoffs.
- Subtract baseline translation before applying individual CSS rotate/scale when committing layout movement; SVG geometry placement uses the baseline linear inverse. Restore the exact original inline transform and priority, leaving stylesheet-backed values without an inline override. Preview state never enters serialized styles. `PlacementTransform.test.ts` covers baseline retention and restoration; consumer pointer regressions cover rendered movement, direction, history and reopening.
