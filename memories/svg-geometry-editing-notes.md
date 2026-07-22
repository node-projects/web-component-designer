# SVG geometry editing

- SVG geometry preview translation is already local with respect to individual CSS `rotate`/`scale`, so the placement commit skips that remapping for supported SVG geometry. It then maps the remaining offset through the inverse linear part of the authored `transform`; translation components are ignored because this is an offset vector.
- `SvgRectGeometryReader` reads rendered geometry from `getBBox()` and carries serialization hints for style-versus-attribute storage and units. Writes must honor those hints instead of always creating attributes.
- `UnifiedGeometryExtension` creates drag state on pointer-down for capture, but commits only after a non-zero move sets `geometryChanged`; clicking a handle alone must not create an undo entry.
