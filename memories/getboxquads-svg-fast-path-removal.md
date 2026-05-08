# getBoxQuads SVG fast path removal

The SVGGraphicsElement fast path in `getBoxQuads.js` used `getBoundingClientRect()` as the returned quad and then manually inflated stroke. That is not a correct substitute for native `getBoxQuads` on SVG geometry and can produce bad `relativeTo` results in split/designer views.

For SVG graphics, let the normal SVG matrix path use `getBBox()` plus the accumulated transform instead. This produces stable document/canvas/svg-relative quads for the diagonal line sample without designer-side compensation.
