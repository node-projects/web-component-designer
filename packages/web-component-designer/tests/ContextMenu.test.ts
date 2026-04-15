/** @jest-environment jsdom */

import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from '@jest/globals';

let ContextMenu: typeof import('../src/elements/helper/contextMenu/ContextMenu').ContextMenu;

const originalCSSStyleSheet = globalThis.CSSStyleSheet;
const originalShowPopover = HTMLElement.prototype.showPopover;
const originalHidePopover = HTMLElement.prototype.hidePopover;
const originalMatches = HTMLElement.prototype.matches;
const popoverOpenAttribute = 'data-test-popover-open';

function makeRect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    x: left,
    y: top,
    width,
    height,
    top,
    right: left + width,
    bottom: top + height,
    left,
    toJSON() {
      return {};
    }
  } as DOMRect;
}

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

  HTMLElement.prototype.showPopover = function () {
    this.setAttribute(popoverOpenAttribute, '');
  };
  HTMLElement.prototype.hidePopover = function () {
    this.removeAttribute(popoverOpenAttribute);
  };
  HTMLElement.prototype.matches = function (selectors: string) {
    if (selectors === ':popover-open') {
      return this.hasAttribute(popoverOpenAttribute);
    }

    return originalMatches.call(this, selectors);
  };

  ({ ContextMenu } = await import('../src/elements/helper/contextMenu/ContextMenu'));
});

beforeEach(() => {
  document.body.innerHTML = '';
  document.adoptedStyleSheets = [];
});

afterEach(() => {
  ContextMenu?.closeAll();
  document.body.innerHTML = '';
});

afterAll(() => {
  Object.defineProperty(globalThis, 'CSSStyleSheet', {
    configurable: true,
    value: originalCSSStyleSheet
  });

  if (originalShowPopover == null)
    delete HTMLElement.prototype.showPopover;
  else
    HTMLElement.prototype.showPopover = originalShowPopover;

  if (originalHidePopover == null)
    delete HTMLElement.prototype.hidePopover;
  else
    HTMLElement.prototype.hidePopover = originalHidePopover;

  HTMLElement.prototype.matches = originalMatches;
});

test('displays the root menu as a manual popover', () => {
  const menu = new ContextMenu([{ title: 'Item' }]);
  menu.display(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 48, clientY: 64 }));

  const menuElement = document.querySelector('.context_menu') as HTMLDivElement;

  expect(menuElement.getAttribute('popover')).toBe('manual');
  expect(menuElement.hasAttribute(popoverOpenAttribute)).toBe(true);
  expect(menuElement.style.left).toBe('50px');
  expect(menuElement.style.top).toBe('66px');
});

test('opens submenus as manual popovers', () => {
  new ContextMenu([{ title: 'Parent', children: [{ title: 'Child' }] }]);

  const parentItem = document.querySelector('.context_menu li') as HTMLLIElement;
  const childmenu = parentItem.querySelector('ul') as HTMLUListElement;
  Object.defineProperty(parentItem, 'getBoundingClientRect', {
    configurable: true,
    value: () => makeRect(40, 20, 80, 24)
  });
  Object.defineProperty(childmenu, 'getBoundingClientRect', {
    configurable: true,
    value: () => makeRect(0, 0, 90, 100)
  });
  Object.defineProperty(childmenu, 'offsetWidth', { configurable: true, value: 90 });
  Object.defineProperty(childmenu, 'offsetHeight', { configurable: true, value: 100 });

  parentItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

  expect(childmenu.getAttribute('popover')).toBe('manual');
  expect(childmenu.classList.contains('context_menu_submenu_popover')).toBe(true);
  expect(childmenu.hasAttribute(popoverOpenAttribute)).toBe(true);
  expect(childmenu.style.left).toBe('120px');
  expect(childmenu.style.top).toBe('20px');
});

test('closeAll removes the menu from the document', () => {
  const menu = new ContextMenu([{ title: 'Item' }]);
  menu.display(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 12, clientY: 24 }));

  ContextMenu.closeAll();

  expect(document.querySelector('.context_menu')).toBeNull();
});