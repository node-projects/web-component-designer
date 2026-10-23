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
      cssRules = [];
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

test('uses the event window for menu creation, styles, actions and dismissal', () => {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  const view = frame.contentWindow as Window & typeof globalThis;
  const owner = view.document;
  Object.defineProperty(view, 'CSSStyleSheet', { configurable: true, value: globalThis.CSSStyleSheet });
  Object.defineProperty(owner, 'adoptedStyleSheets', { configurable: true, writable: true, value: [] });
  view.HTMLElement.prototype.showPopover = HTMLElement.prototype.showPopover;
  view.HTMLElement.prototype.hidePopover = HTMLElement.prototype.hidePopover;
  view.HTMLElement.prototype.matches = HTMLElement.prototype.matches;
  let clicked = false;
  const event = () => new view.MouseEvent('contextmenu', { view, clientX: 20, clientY: 30 });
  const menu = ContextMenu.show([{ title: 'Action', action: () => { clicked = true; } }], event());
  expect(document.querySelector('.context_menu')).toBeNull();
  const root = owner.querySelector('.context_menu');
  expect(root.ownerDocument).toBe(owner);
  expect(owner.adoptedStyleSheets.length).toBe(1);
  const row = root.querySelector('li');
  expect(row.ownerDocument).toBe(owner);
  row.dispatchEvent(new view.MouseEvent('mousedown', { bubbles: true, composed: true }));
  expect(root.isConnected).toBe(true);
  row.dispatchEvent(new view.MouseEvent('click', { bubbles: true, composed: true }));
  expect(clicked).toBe(true);
  expect(root.isConnected).toBe(false);
  ContextMenu.show([{ title: 'Dismiss' }], event());
  view.dispatchEvent(new view.KeyboardEvent('keyup', { key: 'Escape' }));
  expect(owner.querySelector('.context_menu')).toBeNull();
  ContextMenu.show([{ title: 'Outside' }], event());
  owner.body.dispatchEvent(new view.MouseEvent('mousedown', { bubbles: true, composed: true }));
  expect(owner.querySelector('.context_menu')).toBeNull();
  menu.close();

  Object.defineProperty(view, 'innerWidth', { configurable: true, value: 100 });
  Object.defineProperty(view, 'innerHeight', { configurable: true, value: 80 });
  const positioned = new ContextMenu([{ title: 'Parent', children: [{ title: 'Child' }] }], { shadowRoot: owner });
  const positionedRoot = owner.querySelector('.context_menu') as HTMLElement;
  Object.defineProperty(positionedRoot, 'offsetWidth', { configurable: true, value: 80 });
  Object.defineProperty(positionedRoot, 'offsetHeight', { configurable: true, value: 60 });
  positioned.display(new view.MouseEvent('contextmenu', { view, clientX: 90, clientY: 70 }));
  expect(positionedRoot.style.left).toBe('4px');
  expect(positionedRoot.style.top).toBe('4px');
  const parent = positionedRoot.querySelector('li');
  const child = parent.querySelector('ul');
  Object.defineProperty(parent, 'getBoundingClientRect', { configurable: true, value: () => makeRect(65, 70, 30, 20) });
  Object.defineProperty(child, 'offsetWidth', { configurable: true, value: 70 });
  Object.defineProperty(child, 'offsetHeight', { configurable: true, value: 50 });
  parent.dispatchEvent(new view.MouseEvent('mouseenter'));
  expect(child.style.left).toBe('0px');
  expect(child.style.top).toBe('30px');
  positioned.close();
});
