/** @jest-environment jsdom */

import { beforeAll, beforeEach, expect, test } from '@jest/globals';

let DesignerToolbar: typeof import('../src/elements/widgets/designerView/tools/toolBar/DesignerToolbar').DesignerToolbar;
let DesignerToolbarButton: typeof import('../src/elements/widgets/designerView/tools/toolBar/DesignerToolbarButton').DesignerToolbarButton;
let DraggableToolWindow: typeof import('../src/elements/widgets/designerView/tools/toolBar/popups/DraggableToolWindow').DraggableToolWindow;
let TestToolWindow: any;

beforeAll(async () => {
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
});

test('toggles the transform popup and can reopen it after closing', () => {
  const toolbar = new DesignerToolbar();
  toolbar.designerView = { designerCanvas: {} } as any;
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
