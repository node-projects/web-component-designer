# Jest testing notes

- Tests in `packages/web-component-designer/tests` import source modules without a `.js` suffix; the package's ts-jest ESM configuration maps runtime `.js` imports back to source paths.
- Node/JSDOM CSS shorthand serialization is not dependable for `CssCombiner`. Its focused tests install a fake `document.createElement()` and style store before dynamically importing the module because `CssCombiner` creates a helper element at module load.
- DOM-heavy helpers can be tested by stubbing the required globals before dynamic import, as in `PathDataPolyfill.test.ts`; prefer pure helper tests where a browser implementation is not the subject of the test.
