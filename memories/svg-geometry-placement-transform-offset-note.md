- SVG geometry drag commit receives the live preview translation in visual/container
  coordinates. Before writing geometry attributes (`x`, `y`, path points, etc.) for
  elements that already have a CSS `transform`, map that offset through the inverse
  2D linear part of the original transform; otherwise rotated/scaled/skewed SVG
  shapes preview correctly but jump on mouseup.
- The conversion intentionally uses only `a/b/c/d` and ignores translation, because
  it is transforming an offset vector, not an absolute point.
