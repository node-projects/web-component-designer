import { afterEach, expect, test } from '@jest/globals';
import { NpmPackageLoader } from '../src/elements/helper/NpmPackageLoader';
import { WebcomponentManifestElementsService } from '../src/elements/services/elementsService/WebcomponentManifestElementsService';

afterEach(() => {
  delete (globalThis as any).importShim;
});

test('adds import map entries for package export subpaths', async () => {
  const imports = {};
  const addedImportMaps: any[] = [];
  (globalThis as any).importShim = {
    getImportMap: () => ({ imports }),
    addImportMap: (importMap: any) => {
      addedImportMaps.push(importMap);
      Object.assign(imports, importMap.imports);
    }
  };

  const loader = Object.create(NpmPackageLoader.prototype) as NpmPackageLoader;
  await loader.addToImportmap('https://cdn.jsdelivr.net/npm/@floating-ui/utils/', {
    name: '@floating-ui/utils',
    exports: {
      './package.json': './package.json',
      '.': {
        import: {
          types: './dist/floating-ui.utils.d.mts',
          default: './dist/floating-ui.utils.mjs'
        },
        module: './dist/floating-ui.utils.esm.js',
        default: './dist/floating-ui.utils.umd.js'
      },
      './dom': {
        import: {
          types: './dist/floating-ui.utils.dom.d.mts',
          default: './dist/floating-ui.utils.dom.mjs'
        },
        module: './dist/floating-ui.utils.dom.esm.js',
        default: './dist/floating-ui.utils.dom.umd.js'
      }
    },
    main: './dist/floating-ui.utils.umd.js',
    module: './dist/floating-ui.utils.esm.js'
  });

  expect(addedImportMaps).toHaveLength(1);
  expect(addedImportMaps[0].imports['@floating-ui/utils']).toBe('https://cdn.jsdelivr.net/npm/@floating-ui/utils/dist/floating-ui.utils.mjs');
  expect(addedImportMaps[0].imports['@floating-ui/utils/dom']).toBe('https://cdn.jsdelivr.net/npm/@floating-ui/utils/dist/floating-ui.utils.dom.mjs');
  expect(addedImportMaps[0].imports['@floating-ui/utils/']).toBe('https://cdn.jsdelivr.net/npm/@floating-ui/utils/');
});

test('supports string exports and ignores non-runtime export entries', async () => {
  const imports = {};
  const addedImportMaps: any[] = [];
  (globalThis as any).importShim = {
    getImportMap: () => ({ imports }),
    addImportMap: (importMap: any) => {
      addedImportMaps.push(importMap);
      Object.assign(imports, importMap.imports);
    }
  };

  const loader = Object.create(NpmPackageLoader.prototype) as NpmPackageLoader;
  await loader.addToImportmap('https://cdn.jsdelivr.net/npm/example-package/', {
    name: 'example-package',
    exports: {
      '.': './dist/index.js',
      './feature': './dist/feature.js',
      './types-only': {
        types: './dist/types-only.d.ts'
      },
      './blocked': null,
      './pattern/*': './dist/*.js'
    }
  });

  expect(addedImportMaps[0].imports['example-package']).toBe('https://cdn.jsdelivr.net/npm/example-package/dist/index.js');
  expect(addedImportMaps[0].imports['example-package/feature']).toBe('https://cdn.jsdelivr.net/npm/example-package/dist/feature.js');
  expect(addedImportMaps[0].imports['example-package/types-only']).toBeUndefined();
  expect(addedImportMaps[0].imports['example-package/blocked']).toBeUndefined();
  expect(addedImportMaps[0].imports['example-package/pattern/*']).toBeUndefined();
});

test('supports package root exports as a direct string target', async () => {
  const imports = {};
  const addedImportMaps: any[] = [];
  (globalThis as any).importShim = {
    getImportMap: () => ({ imports }),
    addImportMap: (importMap: any) => {
      addedImportMaps.push(importMap);
      Object.assign(imports, importMap.imports);
    }
  };

  const loader = Object.create(NpmPackageLoader.prototype) as NpmPackageLoader;
  await loader.addToImportmap('https://cdn.jsdelivr.net/npm/string-export-package/', {
    name: 'string-export-package',
    exports: './dist/index.js'
  });

  expect(addedImportMaps[0].imports['string-export-package']).toBe('https://cdn.jsdelivr.net/npm/string-export-package/dist/index.js');
  expect(addedImportMaps[0].imports['string-export-package/']).toBe('https://cdn.jsdelivr.net/npm/string-export-package/');
});

test('deduplicates custom element tags listed in manifest exports and declarations', async () => {
  const elements = new WebcomponentManifestElementsService('example-package', 'https://cdn.example.test/example-package/', {
    modules: [
      {
        path: 'sp-button.js',
        exports: [
          {
            kind: 'custom-element-definition',
            name: 'sp-button',
            declaration: { name: 'Button' }
          }
        ],
        declarations: []
      },
      {
        path: 'src/Button.js',
        exports: [],
        declarations: [
          {
            tagName: 'sp-button',
            name: 'Button'
          }
        ]
      }
    ]
  });

  expect((await elements.getElements()).map(x => x.tag)).toEqual(['sp-button']);
});
