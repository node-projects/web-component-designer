export const dragDropFormatNameElementDefinition = 'text/json/elementdefintion';
export const dragDropFormatNameBindingObject = 'text/json/bindingobject';
export const dragDropFormatNamePropertyGrid = 'text/json/propertydrop';

/** Used when the module URL cannot locate the assets and the host configured
 * nothing. Document relative, so it follows a <base href>. */
const fallbackAssetsPath = 'assets/web-component-designer/';

function resolveAssetsPath(): string {
  const configured = (globalThis as { webComponentDesignerAssetsPath?: string }).webComponentDesignerAssetsPath;
  if (configured)
    return configured.endsWith('/') ? configured : configured + '/';

  // Bundlers that do not rewrite import.meta.url replace it with the build
  // machine's file:// path, whose origin is the string "null". Only a URL the
  // browser can actually fetch locates the assets next to this module.
  try {
    const imporUrl = new URL((import.meta.url));
    if (imporUrl.protocol === 'http:' || imporUrl.protocol === 'https:')
      return imporUrl.origin + imporUrl.pathname.split('/').slice(0, -1).join('/') + '/../assets/';
  } catch {
    // import.meta.url unavailable or unparsable, fall through
  }

  return fallbackAssetsPath;
}

export var assetsPath = resolveAssetsPath();

/** Overrides where the designer loads its icons from.
 *
 * Prefer setting globalThis.webComponentDesignerAssetsPath before importing the
 * designer: widgets such as SelectionToolPopup bake assetsPath into a static
 * template while their module evaluates, and never observe a later change. */
export function setAssetsPath(path: string) {
  assetsPath = path.endsWith('/') ? path : path + '/';
}