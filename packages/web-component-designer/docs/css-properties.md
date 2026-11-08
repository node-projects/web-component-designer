# CSS property metadata

`CssProperties.json` supplies camel-cased names, editor types, CSS value syntax,
and keyword suggestions to `CssPropertiesService` (including the current-styles
service). Unknown properties and custom properties remain editable as text.

Regenerate from the repository root:

```sh
node packages/web-component-designer/scripts/update-css-properties.mjs
```

The script pins [MDN CSS data](https://github.com/mdn/data) and
[W3C Webref](https://github.com/w3c/webref) revisions. Update the revisions when
reviewing new CSS. MDN supplies unprefixed properties, syntax references, and
definitions for the at-rule descriptors already in the catalogue. Existing names
are retained; new obsolete, nonstandard, and vendor-prefixed MDN entries are not
added. Webref supplies gap decorations that MDN's dataset does not yet include.

The November 8, 2026 review includes
[`border-shape`](https://developer.chrome.com/blog/new-in-chrome-147),
[`row-rule` and other gap decorations](https://developer.chrome.com/blog/gap-decorations-stable),
and [animation/timeline triggers](https://developer.chrome.com/blog/scroll-triggered-animations).
Other additions fill older gaps, including anchor positioning, masks, view
transitions, scroll timelines, and text-box properties. Inclusion in the catalogue
does not imply support in every browser; experimental properties are included.

CSS lists use the text editor's datalist, so suggestions also allow arbitrary CSS
expressions. Numeric CSS types use `UnitPropertyEditor`, including unitless numbers,
integers, percentages, and number/percentage values. This preserves expressions,
lists, CSS-wide keywords, and `!important`. Mixed shorthands use text input;
numeric lists can use the unit editor's raw-text mode. Syntax and suggestions
describe the grammar; they are not a CSS validator or an exhaustive value list.
