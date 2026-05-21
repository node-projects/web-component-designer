# getBoxQuads fixed elements relative targets

When a node is fixed-positioned but `getBoxQuads({ relativeTo })` targets a
non-root element skipped by the fixed-position containing block jump, first build
the quad in viewport-root coordinates, then convert the viewport quad into the
requested target. This covers both viewport-fixed elements and fixed elements
whose containing block is a transformed ancestor above the designer canvas.
Walking the fixed element directly to the target treats viewport coordinates as
target-local coordinates, which shifts selection overlays by the designer canvas
offset and gets worse in split view or when the target is transformed.
