import { css } from "@node-projects/base-custom-webcomponent";
import { IContextMenuItem } from './IContextMenuItem.js';

export interface IContextMenuOptions {
	defaultIcon?: string,
	subIcon?: string,
	mouseOffset?: number,
	shadowRoot?: ShadowRoot | Document,
	mode?: 'normal' | 'undo'
}

export class ContextMenu {

	private static _contextMenuCss = css`
	  .context_menu {
		position: fixed;
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
		background-color: #f5f7f7;
		box-shadow: 0 0 5px #333;
	  }
	  
	  .context_menu li {
		padding: 0;
		padding-right: 1.7em;
		cursor: pointer;
		white-space: nowrap;
	  }
	  
	  .context_menu li:hover {
		background-color: #bbb;
	  }
	  
	  .context_menu li .context_menu_icon_span {	
		width: 28px;
		display: inline-block;
		border-right: 1px solid #aaa;
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
		top: 0;
		left: 100%;
		opacity: 0;
		transition: opacity 0.2s;
		visibility: hidden;
	  }
	  
	  .context_menu li:hover>ul {
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
	  
	  .context_menu.context_menu_border_right>ul ul {
		left: unset;
		right: 100%;
	  }
	  
	  .context_menu.context_menu_border_bottom>ul ul {
		top: unset;
		bottom: 0;
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

	menu: IContextMenuItem[];
	public options: IContextMenuOptions;
	private num: number;
	private _menuElement: HTMLDivElement;

	constructor(menu: IContextMenuItem[], options?: IContextMenuOptions) {
		this.num = ContextMenu.count++;
		this.menu = menu;
		this.options = options;

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

				if ((item.icon ?? '') != '') {
					icon_span.innerHTML = item.icon;
				} else {
					icon_span.innerHTML = this.options?.defaultIcon ?? '';
				}

				let text_span = document.createElement("span");
				text_span.className = 'context_menu_text';

				text_span.innerHTML = item.title;

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
					if (item.action)
						li.addEventListener('click', (e) => {
							item.action(e, item);
							this.close();
						});
					if (this.options?.mode == 'undo') {
						li.addEventListener('mouseup', (e) => {
							item.action(e, item);
							this.close();
						});
					}
					if (item.children != null) {
						let childmenu = this.renderLevel(item.children);
						li.appendChild(childmenu);
						li.addEventListener('mouseenter', () => {
							const childRect = childmenu.getBoundingClientRect();
							if (childRect.top + childRect.height > window.innerHeight) {
								childmenu.style.top = 'unset';
								childmenu.style.bottom = '0';
							}
							if (this.options?.mode == 'undo') {
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
						});
					} else {
						if (this.options?.mode == 'undo') {
							li.addEventListener('mouseenter', () => {
								let select = true;
								for (let node of li.parentElement.children) {
									if (select)
										(<HTMLElement>node).classList.add('context_menu_marked')
									else
										(<HTMLElement>node).classList.remove('context_menu_marked')
									if (node == li)
										select = false
								}
							});
						}
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

		let clickCoords = { x: event.clientX, y: event.clientY };
		let clickCoordsX = clickCoords.x;
		let clickCoordsY = clickCoords.y;

		let menuWidth = menu.offsetWidth + 4;
		let menuHeight = menu.offsetHeight + 4;

		let windowWidth = window.innerWidth;
		let windowHeight = window.innerHeight;

		let mouseOffset = this.options?.mouseOffset != null ? this.options.mouseOffset : 2;

		if ((windowWidth - clickCoordsX) < menuWidth) {
			menu.style.left = windowWidth - menuWidth + "px";
		} else {
			menu.style.left = (clickCoordsX + mouseOffset) + "px";
		}

		if ((windowHeight - clickCoordsY) < menuHeight) {
			menu.style.top = windowHeight - menuHeight + "px";
		} else {
			menu.style.top = (clickCoordsY + mouseOffset) + "px";
		}

		let sizes = ContextUtil.getSizes(menu);

		if ((windowWidth - clickCoordsX) < sizes.width) {
			menu.classList.add("context_menu_border_right");
		} else {
			menu.classList.remove("context_menu_border_right");
		}

		if ((windowHeight - clickCoordsY) < sizes.height) {
			menu.classList.add("context_menu_border_bottom");
		} else {
			menu.classList.remove("context_menu_border_bottom");
		}

		menu.classList.add("context_menu_display");

		event.preventDefault();

		window.addEventListener("keyup", this._windowKeyUp);
		window.addEventListener("mousedown", this._windowDown);
		window.addEventListener("resize", this._windowResize);
		setTimeout(() => window.addEventListener("contextmenu", this._windowDown), 100);
	}

	_windowResize() {
		this.close();
	}

	_windowDown(e: MouseEvent) {
		e.preventDefault();
		const p = e.composedPath();
		if (p.indexOf(this._menuElement) < 0)
			this.close();
		return false;
	}

	_windowKeyUp(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			this.close();
		}
	}

	static show(menu: IContextMenuItem[], event: MouseEvent, options?: IContextMenuOptions) {
		let ctxMenu = new ContextMenu(menu, options);
		ctxMenu.display(event);
		return ctxMenu;
	}

	close() {
		this._menuElement.remove();
		window.removeEventListener("keyup", this._windowKeyUp);
		window.removeEventListener("mousedown", this._windowDown);
		window.removeEventListener("resize", this._windowResize);
		setTimeout(() => window.removeEventListener("contextmenu", this._windowDown), 10);
	}
}

class ContextUtil {
	static getSizes(obj) {
		let lis = obj.getElementsByTagName('li');

		let width_def = 0;
		let height_def = 0;

		for (let i = 0; i < lis.length; i++) {
			let li = lis[i];

			if (li.offsetWidth > width_def) {
				width_def = li.offsetWidth;
			}

			if (li.offsetHeight > height_def) {
				height_def = li.offsetHeight;
			}
		}

		let width = width_def;
		let height = height_def;

		for (let i = 0; i < lis.length; i++) {
			let li = lis[i];

			let ul = li.getElementsByTagName('ul');
			if (typeof ul[0] !== "undefined") {
				let ul_size = ContextUtil.getSizes(ul[0]);

				if (width_def + ul_size.width > width) {
					width = width_def + ul_size.width;
				}

				if (height_def + ul_size.height > height) {
					height = height_def + ul_size.height;
				}
			}
		}

		return {
			"width": width,
			"height": height
		};
	}
}
