- In packages/web-component-designer, Jest currently has unrelated ESM/module-resolution issues for tests that import dist ESM output or dependencies like @node-projects/base-custom-webcomponent from node_modules.
- For new service wiring in this package, npm run tsc is the reliable validation path unless Jest config is widened on purpose.

- For isolated DOM-focused tests, replacing a single `css` helper import with a local `CSSStyleSheet` creator can avoid the Jest ESM boundary without widening package-level Jest transforms.
- For custom-element or editor work in this package, extracting pure parsing/configuration helpers into source files without DOM or @node-projects/base-custom-webcomponent imports gives Jest a stable focused validation target without changing package-wide ESM transforms.

