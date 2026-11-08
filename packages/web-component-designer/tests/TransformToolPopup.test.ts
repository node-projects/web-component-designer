/** @jest-environment jsdom */

import { beforeAll, beforeEach, expect, jest, test } from '@jest/globals';

let DesignerToolbar: typeof import('../src/elements/widgets/designerView/tools/toolBar/DesignerToolbar').DesignerToolbar;
let DesignerToolbarButton: typeof import('../src/elements/widgets/designerView/tools/toolBar/DesignerToolbarButton').DesignerToolbarButton;
let DraggableToolWindow: typeof import('../src/elements/widgets/designerView/tools/toolBar/popups/DraggableToolWindow').DraggableToolWindow;
let TestToolWindow: any;
let visibilityChanged: IntersectionObserverCallback;
const observe = jest.fn();
const disconnect = jest.fn();

beforeAll(async () => {
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    value: class {
      constructor(callback: IntersectionObserverCallback) { visibilityChanged = callback; }
      observe = observe;
      disconnect = disconnect;
    }
  });
  Object.defineProperty(globalThis, 'CSSStyleSheet', {
    configurable: true,
    value: class {
      replaceSync() {
      }
    }
  });
  Object.defineProperty(document, 'adoptedStyleSheets', {
    configurable: true,
    writable: true,
    value: []
  });

  ({ DesignerToolbar } = await import('../src/elements/widgets/designerView/tools/toolBar/DesignerToolbar'));
  ({ DesignerToolbarButton } = await import('../src/elements/widgets/designerView/tools/toolBar/DesignerToolbarButton'));
  ({ DraggableToolWindow } = await import('../src/elements/widgets/designerView/tools/toolBar/popups/DraggableToolWindow'));
  TestToolWindow = class extends DraggableToolWindow {
    protected get windowTitle() { return 'Test'; }
    protected get windowTemplate() { return '<div></div>'; }
  };
  customElements.define('test-draggable-tool-window', TestToolWindow);
});

beforeEach(() => {
  document.body.innerHTML = '';
  document.adoptedStyleSheets = [];
  jest.clearAllMocks();
});

test('closes the popup when its canvas is hidden and disconnects the observer', () => {
  const toolbar = new DesignerToolbar();
  const canvas = document.createElement('div');
  toolbar.designerView = { designerCanvas: canvas } as any;
  const button = new DesignerToolbarButton({} as any, { '': { icon: '' } });
  button.popup = TestToolWindow;

  toolbar.showPopup(button);
  expect(observe).toHaveBeenCalledWith(canvas);
  visibilityChanged([{ isIntersecting: true } as IntersectionObserverEntry], null);
  expect(document.querySelectorAll('test-draggable-tool-window')).toHaveLength(1);

  visibilityChanged([{ isIntersecting: false } as IntersectionObserverEntry], null);
  expect(document.querySelectorAll('test-draggable-tool-window')).toHaveLength(0);
  expect(disconnect).toHaveBeenCalledTimes(1);

  toolbar.showPopup(button);
  expect(document.querySelectorAll('test-draggable-tool-window')).toHaveLength(1);
  expect(observe).toHaveBeenCalledTimes(2);
});

test('toggles the transform popup and can reopen it after closing', () => {
  const toolbar = new DesignerToolbar();
  toolbar.designerView = { designerCanvas: document.createElement('div') } as any;
  const button = new DesignerToolbarButton({} as any, { '': { icon: '' } });
  button.popup = TestToolWindow;

  toolbar.showPopup(button);
  expect(document.querySelectorAll('test-draggable-tool-window')).toHaveLength(1);

  toolbar.showPopup(button);
  expect(document.querySelectorAll('test-draggable-tool-window')).toHaveLength(0);

  toolbar.showPopup(button);
  expect(document.querySelectorAll('test-draggable-tool-window')).toHaveLength(1);

  const closeButton = document.querySelector('test-draggable-tool-window').shadowRoot.querySelector('#close-btn') as HTMLButtonElement;
  closeButton.click();
  expect(document.querySelectorAll('test-draggable-tool-window')).toHaveLength(0);

  toolbar.showPopup(button);
  expect(document.querySelectorAll('test-draggable-tool-window')).toHaveLength(1);
});
