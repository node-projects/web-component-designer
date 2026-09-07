/** Used when the module URL cannot locate the package files and the host
 * configured nothing. Document relative, so it follows a <base href>. */
const fallbackBasePath = 'assets/web-component-designer-zpl/';

function resolveBasePath(): string {
  const configured = (globalThis as { webComponentDesignerZplBasePath?: string }).webComponentDesignerZplBasePath;
  if (configured)
    return configured.endsWith('/') ? configured : configured + '/';

  // Bundlers that do not rewrite import.meta.url replace it with the build
  // machine's file:// path, which the browser cannot fetch. Only a real URL
  // locates widgets/elements.json and assets/fonts next to this module.
  try {
    const moduleUrl = new URL(import.meta.url);
    if (moduleUrl.protocol === 'http:' || moduleUrl.protocol === 'https:')
      return moduleUrl.origin + moduleUrl.pathname.split('/').slice(0, -1).join('/') + '/';
  } catch {
    // import.meta.url unavailable or unparsable, fall through
  }

  return fallbackBasePath;
}

/** Directory holding this package's runtime files: widgets/elements.json and
 * assets/fonts. Both must be published by the host application. */
export var zplBasePath = resolveBasePath();

/** Overrides where the ZPL add-on loads its element definitions and printer
 * fonts from. Prefer setting globalThis.webComponentDesignerZplBasePath before
 * importing the add-on, so nothing reads the value before it is configured. */
export function setZplBasePath(path: string) {
  zplBasePath = path.endsWith('/') ? path : path + '/';
}

/** Resolves a package relative file against the configured base path, so a
 * document relative default still produces an absolute URL. */
export function zplPackageUrl(relativePath: string): URL {
  const base = typeof document === 'undefined' ? undefined : document.baseURI;
  return new URL(zplBasePath + relativePath, base);
}
