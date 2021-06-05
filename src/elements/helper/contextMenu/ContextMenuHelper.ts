import { IContextMenuItem } from "./IContextmenuItem";
import { css } from "@node-projects/base-custom-webcomponent"

export class ContextMenuHelper {

  private static _contextMenuCss = css`
  .context-menu {
    display: none;
    position: absolute;
    z-index: 999999;
    padding: 0px 0;
    background-color: rgb(255 255 255 / 93%);
    border: solid 1px #dfdfdf;
    box-shadow: 1px 1px 2px #cfcfcf;
    cursor: default;
    user-select: none;
    border-radius: 12px;
  }

  .context-menu hr {
    margin: 0 0 5px 5%;
    height: 1px;
    width: 90%;
    background-color: #e2e2e2;
  }
  
  .context-menu--active {
    display: block;
  }
  
  .context-menu__items {
    list-style: none;
    margin: 8px;
    padding: 0;
  }
  
  .context-menu__item {
    display: block;
    margin-bottom: 4px;
  }
  
  .context-menu__item:last-child {
    margin-bottom: 0;
  }
  
  .context-menu__link {
    display: block;
    padding: 0px 12px;
    color: #0066aa;
    text-decoration: none;
  }
  
  .context-menu__link:hover {
    color: #fff;
    background-color: #0066aa;
  }`;

  private _shadowRoot: ShadowRoot | Document;
  private _element: HTMLElement;
  private _closeBound: () => void;
  private _keyUpBound: () => void;
  private _closeOnDownBound: () => void;
  private _closeOnUpBound: () => void;

  static addContextMenu(element: HTMLElement, items: IContextMenuItem[]) {
    element.oncontextmenu = (event) => {
      event.preventDefault();
      ContextMenuHelper.showContextMenu(null, event, null, items);
    }
  }

  static showContextMenu(shadowRoot: ShadowRoot | Document | null, e: MouseEvent, element: HTMLElement, items: IContextMenuItem[]) {
    if (shadowRoot == null)
      shadowRoot = document;

    //@ts-ignore
    if (shadowRoot.adoptedStyleSheets.indexOf(ContextMenuHelper._contextMenuCss) < 0) {
      //@ts-ignore
      shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, ContextMenuHelper._contextMenuCss];
    }
    let ctxMenu = new ContextMenuHelper();
    let menu = ContextMenuHelper.createMenu(ctxMenu, items);
    ctxMenu.init(shadowRoot, menu);
    ctxMenu.positionMenu(e)
    return ctxMenu;
  }

  private constructor() {
  }

  private init(shadowRoot: ShadowRoot | Document, element: HTMLElement) {
    this._shadowRoot = shadowRoot;
    this._element = element;
    if (this._shadowRoot === document)
      document.body.appendChild(this._element);
    else
      this._shadowRoot.appendChild(this._element);

    this._closeBound = this.close.bind(this);
    this._closeOnUpBound = this._closeOnUp.bind(this);
    this._closeOnDownBound = this._closeOnDown.bind(this);
    this._keyUpBound = this._keyUp.bind(this);

    window.addEventListener('keyup', this._keyUpBound);
    window.addEventListener('resize', this._closeBound);
    window.addEventListener('mousedown', this._closeOnDownBound);
    window.addEventListener('mouseup', this._closeOnUpBound);

    this._element.classList.add('context-menu--active');
  }

  public close() {
    requestAnimationFrame(() => {
      window.removeEventListener('keyup', this._keyUpBound);
      window.removeEventListener('resize', this._closeBound);
      window.removeEventListener('mousedown', this._closeOnDownBound);
      window.removeEventListener('mouseup', this._closeOnUpBound);

      if (this._shadowRoot === document)
        document.body.removeChild(this._element);
      else
        this._shadowRoot.removeChild(this._element);
    });
  }

  public show() {
    this._element.classList.add('context-menu--active');
  }

  public hide() {
    this._element.classList.remove('context-menu--active');
  }

  private _keyUp(e: KeyboardEvent) {
    if (e.keyCode === 27) {
      this.close();
    }
  }

  private _closeOnDown(e: MouseEvent) {
    const p = e.composedPath();
    if (p.indexOf(this._element) < 0)
      this.close();
  }

  private _closeOnUp(e: MouseEvent) {
    if (e.button == 1)
      this.close();
  }

  static createMenu(helper: ContextMenuHelper, items: IContextMenuItem[]) {
    let nav = document.createElement('nav');
    nav.className = 'context-menu';
    let ul = document.createElement('ul');
    ul.className = 'context-menu__items';
    nav.appendChild(ul);

    for (let i of items) {
      if (i.title == '-') {
        let hr = document.createElement('hr');
        ul.appendChild(hr);
      } else {
        let li = document.createElement('li');
        li.className = 'context-menu__item';
        let div = document.createElement('div');
        div.className = 'context-menu__link';
        div.textContent = i.title;
        li.appendChild(div);
        ul.appendChild(li);
        li.onclick = (e) => {
          helper.close();
          i.action(null, e);
        }
      }
    }
    return nav;
  }

  static clickInsideElement(e, className) {
    let el = e.srcElement || e.target;

    if (el.classList.contains(className)) {
      return el;
    } else {
      while (el = el.parentNode) {
        if (el.classList && el.classList.contains(className)) {
          return el;
        }
      }
    }

    return false;
  }

  static getPosition(e: MouseEvent) {
    let posx = 0;
    let posy = 0;

    //@ts-ignore
    if (!e) e = window.event;

    if (e.pageX || e.pageY) {
      posx = e.pageX + 5;
      posy = e.pageY - 5;
    } else if (e.clientX || e.clientY) {
      posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft + 5;
      posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop - 5;
    }

    return {
      x: posx,
      y: posy
    }
  }

  public positionMenu(e: MouseEvent) {
    let clickCoords = ContextMenuHelper.getPosition(e);
    let clickCoordsX = clickCoords.x;
    let clickCoordsY = clickCoords.y;

    let menuWidth = this._element.offsetWidth + 4;
    let menuHeight = this._element.offsetHeight + 4;

    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;

    if ((windowWidth - clickCoordsX) < menuWidth) {
      this._element.style.left = windowWidth - menuWidth + "px";
    } else {
      this._element.style.left = clickCoordsX + "px";
    }

    if ((windowHeight - clickCoordsY) < menuHeight) {
      this._element.style.top = windowHeight - menuHeight + "px";
    } else {
      this._element.style.top = clickCoordsY + "px";
    }
  }
}