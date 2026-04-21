import { css } from '@node-projects/base-custom-webcomponent';
import { IContextMenu, IContextMenuItem } from './IContextMenuItem.js';


export interface IContextMenuOptions {
  defaultIcon?: string,
  subIcon?: string,
  mouseOffset?: number,
  shadowRoot?: ShadowRoot | Document,
  mode?: 'normal' | 'undo'
}

export class ContextMenu implements IContextMenu {

  private static _contextMenuCss = css`
	  .context_menu {
		position: fixed;
    inset: auto;
    margin: 0;
    border: none;
    background: transparent;
    overflow: visible;
		opacity: 0;
		transform: scale(0);
		transition: transform 0.1s;
		transform-origin: top left;
		padding: 0;
		z-index: 2147483647;
		color: black;
	  }
	  
	  .context_menu.context_menu_display {
		opacity: 1;
		transform: scale(1);
	  }
	  
	  .context_menu,
	  .context_menu * {
		box-sizing: border-box;
	  }
	  
	  .context_menu * {
		position: relative;
	  }
	  
	  .context_menu ul {
		list-style-type: none;
		padding: 3px;
		margin: 0;
    border: none;
		background-color: #f5f7f7;
		box-shadow: 0 0 5px #333;
    max-inline-size: calc(100vw - 8px);
    max-block-size: calc(100vh - 8px);
    overflow: auto;
    overscroll-behavior: contain;
    isolation: isolate;
	  }

    .context_menu ul[popover] {
    inset: auto;
    margin: 0;
    border: none;
    }
	  
	  .context_menu li {
		padding: 0;
		padding-right: 1.7em;
		cursor: pointer;
		white-space: nowrap;
		display: flex;
		align-items: center;
	  }
	  
	  .context_menu li:hover {
		background-color: #bbb;
	  }
	  
	  .context_menu li .context_menu_icon_span {	
		width: 28px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	  }

	  .context_menu li .context_menu_icon_span img {	
		height: 18px;
	  }

	  .context_menu li .context_menu_text {	
		padding-left: 2px;
		vertical-align: middle;
	  }
	  
	  .context_menu li .context_menu_sub_span {
		width: 1em;
		display: inline-block;
		text-align: center;
		position: absolute;
		top: 50%;
		right: 0.5em;
		transform: translateY(-50%);
	  }
	  
	  .context_menu li>ul {
		position: absolute;
    inset: auto;
		top: 0;
		left: 100%;
		opacity: 0;
		transition: opacity 0.2s;
		visibility: hidden;
	  }

    .context_menu li>ul.context_menu_submenu_popover {
    position: fixed;
    }
	  
    .context_menu li>ul:popover-open {
		opacity: 1;
		visibility: visible;
	  }
	  
	  .context_menu li.context_menu_divider {
		border-bottom: 1px solid #aaa;
		margin: 5px;
		padding: 0;
		cursor: default;
	  }
	  
	  .context_menu li.context_menu_divider:hover {
		background-color: inherit;
	  }
	  
	  .context_menu li[disabled=""] {
		color: #777;
		cursor: default;
	  }
	  
	  .context_menu li[disabled=""]:hover {
		background-color: inherit;
	  }
	  
	  .context_menu li.context_menu_marked {
		background-color: #5ebdec;
	  }`;

  static count = 0;

  private static _openedContextMenus = new Set<ContextMenu>();

  menu: IContextMenuItem[];
  public options?: IContextMenuOptions;
  public context: any
  private num: number;
  private _menuElement!: HTMLDivElement;

  constructor(menu: IContextMenuItem[], options?: IContextMenuOptions, context?: any) {
    this.num = ContextMenu.count++;
    this.menu = menu;
    this.options = options;
    this.context = context;

    this.reload();

    this._windowDown = this._windowDown.bind(this);
    this._windowKeyUp = this._windowKeyUp.bind(this);
    this._windowResize = this._windowResize.bind(this);
  }

  reload() {
    let shadowRoot = this.options?.shadowRoot ?? document;

    if (this._menuElement == null) {
      this._menuElement = document.createElement("div");
      this._menuElement.className = "context_menu";
      this._menuElement.id = "context_menu_" + this.num;
      this._menuElement.setAttribute('popover', 'manual');

      if (shadowRoot === document)
        document.body.appendChild(this._menuElement);
      else
        shadowRoot.appendChild(this._menuElement);
    }

    this._menuElement.innerHTML = "";

    if (shadowRoot.adoptedStyleSheets.indexOf(ContextMenu._contextMenuCss) < 0) {
      shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, ContextMenu._contextMenuCss];
    }

    this._menuElement.appendChild(this.renderLevel(this.menu));
  }

  renderLevel(level: IContextMenuItem[]) {
    let ul_outer = document.createElement("ul");

    let addDivider = false;
    level.forEach((item) => {
      if (item.title !== '-') {
        if (addDivider) {
          let li = document.createElement("li");
          li.className = "context_menu_divider";
          addDivider = false;
          ul_outer.appendChild(li);
        }

        let li = document.createElement("li");
        let icon_span = document.createElement("span");
        icon_span.className = 'context_menu_icon_span';

        if (item.checked === true) {
          icon_span.innerHTML = '✔';
        } else if ((item.icon ?? '') != '') {
          icon_span.innerHTML = item.icon ?? '';
        } else {
          icon_span.innerHTML = this.options?.defaultIcon ?? '';
        }



        let text_span = document.createElement("span");
        text_span.className = 'context_menu_text';

        text_span.innerHTML = item.title ?? '';

        let sub_span = document.createElement("span");
        sub_span.className = 'context_menu_sub_span';

        if (item.children != null) {
          sub_span.innerHTML = this.options?.subIcon ?? '&#155;';
        }

        li.appendChild(icon_span);
        li.appendChild(text_span);
        li.appendChild(sub_span);

        if (item.disabled) {
          li.setAttribute("disabled", "");
        } else {
          if (item.checkable) {
            li.addEventListener('click', (e) => {
              e.stopPropagation();
              e.preventDefault();
              item.checked = !item.checked;
              icon_span.innerHTML = item.checked ? '✔' : (item.icon ?? this.options?.defaultIcon ?? '');
              if (item.action)
                item.action(e, item, this.context, this);
            });
          } else if (item.action)
            li.addEventListener('click', (e) => {
              e.stopPropagation();
              e.preventDefault();
              item.action?.(e, item, this.context, this);
              this.close();
            });
          if (this.options?.mode == 'undo') {
            li.addEventListener('mouseup', (e) => {
              e.stopPropagation();
              item.action?.(e, item, this.context, this);
              this.close();
            });
          }

          li.addEventListener('mouseenter', () => {
            this.closeSiblingSubmenus(li);
            if (this.options?.mode == 'undo') {
              this.markUndoItems(li);
            }
          });

          if (item.children != null) {
            let childmenu = this.renderLevel(item.children);
            this.configurePopoverSubmenu(childmenu);
            li.appendChild(childmenu);
            li.addEventListener('mouseenter', () => {
              this.openPopoverSubmenu(li, childmenu);
            });
          }
        }
        ul_outer.appendChild(li);
      } else {
        addDivider = true;
      }
    });

    return ul_outer;
  }

  public display(event: MouseEvent) {
    let menu = this._menuElement;

    let mouseOffset = this.options?.mouseOffset != null ? this.options.mouseOffset : 2;

    this.showPopover(menu);
    this.positionMenu(menu, event.clientX, event.clientY, mouseOffset);

    menu.classList.add("context_menu_display");

    event.preventDefault();

    ContextMenu._openedContextMenus.add(this);

    window.addEventListener("keyup", this._windowKeyUp);
    window.addEventListener("resize", this._windowResize);
    window.addEventListener("mousedown", this._windowDown);
    setTimeout(() => {
      if (!ContextMenu._openedContextMenus.has(this))
        return;
      window.addEventListener("contextmenu", this._windowDown);
    }, 150);
  }

  _windowResize() {
    this.close();
  }

  _windowDown(e: MouseEvent) {
    e.preventDefault();
    if (!(e.target instanceof Node) || !this._menuElement.contains(e.target))
      this.close();
    return false;
  }

  _windowKeyUp(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.close();
    }
  }

  static show(menu: IContextMenuItem[], event: MouseEvent, options?: IContextMenuOptions, context?: any) {
    let ctxMenu = new ContextMenu(menu, options, context);
    ctxMenu.display(event);
    return ctxMenu;
  }

  close() {
    this.hideDescendantSubmenus(this._menuElement);
    this.hidePopover(this._menuElement);
    this._menuElement.remove();
    window.removeEventListener("mousedown", this._windowDown);
    window.removeEventListener("resize", this._windowResize);
    window.removeEventListener("keyup", this._windowKeyUp);
    setTimeout(() => window.removeEventListener("contextmenu", this._windowDown), 10);
    ContextMenu._openedContextMenus.delete(this);
  }

  static closeAll() {
    for (const c of ContextMenu._openedContextMenus.values())
      c.close();
  }

  private configurePopoverSubmenu(childmenu: HTMLUListElement) {
    childmenu.classList.add('context_menu_submenu_popover');
    childmenu.setAttribute('popover', 'manual');
  }

  private markUndoItems(li: HTMLLIElement) {
    if (li.parentElement == null)
      return;

    let select = true;
    for (let node of li.parentElement.children) {
      if (select)
        (<HTMLElement>node).classList.add('context_menu_marked')
      else
        (<HTMLElement>node).classList.remove('context_menu_marked')
      if (node == li)
        select = false
    }
  }

  private closeSiblingSubmenus(li: HTMLLIElement) {
    if (li.parentElement == null)
      return;

    for (const node of li.parentElement.children) {
      if (node !== li) {
        this.hideDescendantSubmenus(node as HTMLElement);
      }
    }
  }

  private hideDescendantSubmenus(element: HTMLElement) {
    const submenus = element.querySelectorAll('ul[popover]');
    for (const submenu of submenus) {
      this.hidePopover(submenu as HTMLElement);
    }
  }

  private openPopoverSubmenu(li: HTMLLIElement, childmenu: HTMLUListElement) {
    this.showPopover(childmenu);
    this.positionSubmenuPopover(li, childmenu);
  }

  private showPopover(element: HTMLElement) {
    if (this.isPopoverOpen(element))
      return;

    element.showPopover();
  }

  private hidePopover(element?: HTMLElement) {
    if (element == null || !this.isPopoverOpen(element))
      return;

    element.hidePopover();
  }

  private isPopoverOpen(element: HTMLElement) {
    return element.matches(':popover-open');
  }

  private positionMenu(menu: HTMLDivElement, clickCoordsX: number, clickCoordsY: number, mouseOffset: number) {
    const menuWidth = menu.offsetWidth + 4;
    const menuHeight = menu.offsetHeight + 4;

    const spaceRight = window.innerWidth - clickCoordsX;
    const spaceLeft = clickCoordsX;
    const spaceBelow = window.innerHeight - clickCoordsY;
    const spaceAbove = clickCoordsY;

    let left = clickCoordsX + mouseOffset;
    if (spaceRight < menuWidth && spaceLeft > spaceRight) {
      left = clickCoordsX - menuWidth - mouseOffset;
    }

    let top = clickCoordsY + mouseOffset;
    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      top = clickCoordsY - menuHeight - mouseOffset;
    }

    menu.style.left = `${Math.max(0, Math.min(left, window.innerWidth - menuWidth))}px`;
    menu.style.top = `${Math.max(0, Math.min(top, window.innerHeight - menuHeight))}px`;
  }

  private positionSubmenuPopover(li: HTMLLIElement, childmenu: HTMLUListElement) {
    const parentRect = li.getBoundingClientRect();
    const childRect = childmenu.getBoundingClientRect();
    const menuWidth = childmenu.offsetWidth || childRect.width;
    const menuHeight = childmenu.offsetHeight || childRect.height;

    const spaceRight = window.innerWidth - parentRect.right;
    const spaceLeft = parentRect.left;
    let left = parentRect.right;
    if (spaceRight < menuWidth && spaceLeft > spaceRight) {
      left = parentRect.left - menuWidth;
    }

    const spaceBelow = window.innerHeight - parentRect.top;
    const spaceAbove = parentRect.bottom;
    let top = parentRect.top;
    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      top = parentRect.bottom - menuHeight;
    }

    childmenu.style.left = `${Math.max(0, Math.min(left, window.innerWidth - menuWidth))}px`;
    childmenu.style.top = `${Math.max(0, Math.min(top, window.innerHeight - menuHeight))}px`;
    childmenu.style.right = 'auto';
    childmenu.style.bottom = 'auto';
  }
}
