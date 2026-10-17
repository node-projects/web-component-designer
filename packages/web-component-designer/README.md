# web-component-designer

[![npm version](https://img.shields.io/npm/v/%40node-projects%2Fweb-component-designer)](https://www.npmjs.com/package/@node-projects/web-component-designer)
[![npm downloads](https://img.shields.io/npm/dm/%40node-projects%2Fweb-component-designer)](https://www.npmjs.com/package/@node-projects/web-component-designer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/node-projects/web-component-designer/blob/master/LICENSE)
[![Publish release packages](https://github.com/node-projects/web-component-designer/actions/workflows/release.yml/badge.svg)](https://github.com/node-projects/web-component-designer/actions/workflows/release.yml)
[![Try the demo](https://img.shields.io/badge/demo-live-536dfe)](https://node-projects.github.io/web-component-designer-demo/index.html)

An embeddable visual editor for HTML pages and web components. Build an editor into your own application with a design canvas, HTML source editing, a component palette, a document tree, and property inspectors.

Originally based on PolymerLabs' wizzywid, the designer now uses standard web components and TypeScript without a Polymer runtime.

![Designer showing a sample HTML layout with a selected button and property inspector](https://raw.githubusercontent.com/node-projects/web-component-designer/master/packages/web-component-designer/docs/images/designer-dark.jpg)

## Installation and integration

```sh
npm install @node-projects/web-component-designer
```

Use a browser application with a bundler that resolves npm imports. Create the default services, then mount a document container:

```ts
import {
  createDefaultServiceContainer,
  DocumentContainer,
} from '@node-projects/web-component-designer';

const services = createDefaultServiceContainer();
const designer = new DocumentContainer(
  services,
  '<button style="padding: 12px 20px">Hello, designer!</button>',
);
designer.style.cssText = 'display: block; height: 600px;';
document.body.appendChild(designer);
await designer.whenReady();

// Commit pending source edits before reading the current HTML.
async function getHtml() {
  await designer.commitPendingChanges();
  return designer.content;
}
```

This mounts the document editor with its Designer, Code, Split, and Preview tabs. The default services include a simple code editor. Add palette, tree, and property widgets to build a full editor shell; the [simple demo source](https://github.com/node-projects/web-component-designer-simple-demo) and [full demo source](https://github.com/node-projects/web-component-designer-demo) show how to connect them.

The core package depends on `@node-projects/base-custom-webcomponent`. Rich code editors and other integrations live in optional packages, so you can choose the dependencies your application needs.

## Features

- Visual selection, drag-and-drop, resizing, rotation, snapping, and layout tools.
- HTML source, split, and preview views alongside the design canvas.
- Undo/redo, copy/paste, custom element palettes, document trees, and property inspectors.
- Configurable services for parsing, placement, properties, and other editor behavior.
- Optional Ace, CodeMirror 5/6, Monaco, Wunderbaum, collaboration, Mermaid, and ZPL integrations.

## Theming

Style the designer UI with CSS custom properties on an ancestor, such as `--wcd-color-surface`, `--wcd-color-text`, and `--wcd-color-accent`. See [THEMING.md](THEMING.md) for the token reference. Style the document itself through `designer.additionalStyles` or `designer.additionalStylesheets`.

## Pointer shortcuts

| Shortcut | Action |
| --- | --- |
| Alt | Select an element behind another element. |
| Shift | Draw a selection rectangle. |
| Ctrl | Add or remove an element from the selection. |
| Ctrl + Shift | Pan the canvas. |

## Documentation and development

See the [repository README](https://github.com/node-projects/web-component-designer#readme) for optional package descriptions, browser and touch support, development commands, and release instructions.

[Full demo](https://node-projects.github.io/web-component-designer-demo/index.html) · [Simple demo](https://node-projects.github.io/web-component-designer-simple-demo/index.html) · [Issues](https://github.com/node-projects/web-component-designer/issues)

## License

[MIT](https://github.com/node-projects/web-component-designer/blob/master/LICENSE). Some icons originate from [Chrome DevTools](https://github.com/ChromeDevTools/devtools-frontend/blob/main/LICENSE).
