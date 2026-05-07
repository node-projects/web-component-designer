For the getBoxQuads polyfill SVG graphics fast path, diagonal SVG lines need
stroke expansion along the normal vector (`strokeWidth / 2 * abs(dy|dx) / length`)
instead of the generic `strokeWidth * 2` inflation. Keep the legacy generic SVG
inflation for non-line graphics unless replacing it with a fully native-compatible
stroke bbox calculation; the existing path fixture relies on that behavior.
