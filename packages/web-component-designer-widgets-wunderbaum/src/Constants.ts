/** Used when the module URL cannot locate the assets and the host configured
 * nothing. Document relative, so it follows a <base href>. */
const fallbackAssetsPath = 'assets/web-component-designer-widgets-wunderbaum/';

function resolveAssetsPath(): string {
  const configured = (globalThis as { wunderbaumWidgetsAssetsPath?: string }).wunderbaumWidgetsAssetsPath;
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

/** Overrides where these widgets load their icons from. Prefer setting
 * globalThis.wunderbaumWidgetsAssetsPath before importing them. */
export function setAssetsPath(path: string) {
  assetsPath = path.endsWith('/') ? path : path + '/';
}