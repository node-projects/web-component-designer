# getBoxQuads SVG visual boxes

SVGGraphicsElement quads should be built from a local SVG visual box, then transformed into the requested coordinate system. A viewport `getBoundingClientRect()` shortcut is not generally correct because it is already post-transform and loses orientation under rotated/3D HTML ancestors. A raw `getBBox()` is also not enough because native Firefox includes stroke bounds for SVG lines and paths.

The current polyfill computes a local visual box from `getBBox()` plus stroke inflation, uses `getScreenCTM()` when there is no transformed HTML ancestor, and otherwise uses the existing accumulated transform matrix. This covers plain lines, nested SVG-in-SVG lines, CSS-transformed SVGs, and the i14 stroke-bound path sample.
