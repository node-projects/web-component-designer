# SVG and fixed-element box quads

- SVG graphics quads start from a local visual box and are transformed into the requested coordinate system. A viewport `getBoundingClientRect()` shortcut loses orientation, while raw `getBBox()` alone misses the intended stroke bounds.
- With no transformed HTML ancestor, the SVG path can use `getScreenCTM()` and convert back to the requested target. Otherwise it uses the accumulated transform walk.
- SVG line stroke inflation expands along the line normal (`strokeWidth / 2` projected by `dx`/`dy`) and adds endpoint inflation for round/square caps. Non-line SVG graphics retain the generic inflation required by existing path fixtures.
- Do not seed a non-root `SVGGraphicsElement` with its own CSS transform when the walk also multiplies `getCTM()`; `getCTM()` already contains the local SVG/CSS transform.
- Fixed-position nodes whose containing-block walk skips the requested non-root target are first resolved in viewport-root coordinates, then converted into the target coordinate system.
