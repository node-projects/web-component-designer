import { css } from "@node-projects/base-custom-webcomponent";
import { IContextMenuItem } from "./IContextmenuItem";

export interface IContextMenuOptions {
	defaultIcon?: string,
	subIcon?: string,
	mouseOffset?: number,
	shadowRoot?: ShadowRoot | Document
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
	  }
	  
	  .context_menu.display {
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
		padding: 0;
		margin: 0;
		background-color: #ccc;
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
	  
	  .context_menu li .cm_icon_span {
		width: 1.5em;
		height: 1.2em;
		vertical-align: bottom;
		display: inline-block;
		border-right: 1px solid #aaa;
		margin-right: 5px;
		padding-right: 5px;
		text-align: center;
	  }
	  
	  .context_menu li .cm_sub_span {
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
	  
	  .context_menu li.cm_divider {
		border-bottom: 1px solid #aaa;
		margin: 5px;
		padding: 0;
		cursor: default;
	  }
	  
	  .context_menu li.cm_divider:hover {
		background-color: inherit;
	  }
	  
	  .context_menu.cm_border_right>ul ul {
		left: unset;
		right: 100%;
	  }
	  
	  .context_menu.cm_border_bottom>ul ul {
		top: unset;
		bottom: 0;
	  }
	  
	  .context_menu li[disabled=""] {
		color: #777;
		cursor: default;
	  }
	  
	  .context_menu li[disabled=""]:hover {
		background-color: inherit;
	  }`;

	static count = 0;

	menu: IContextMenuItem[];
	public options: IContextMenuOptions;
	private num: number;
	private _windowDownBound: any;
	private _windowUpBound: any;
	private _windowKeyUpBound: any;
	private _windowResizeBound: any;
	private _menuElement: HTMLDivElement;

	constructor(menu: IContextMenuItem[], options?: IContextMenuOptions) {
		this.num = ContextMenu.count++;
		this.menu = menu;
		this.options = options;

		this.reload();

		this._windowDownBound = this._windowDown.bind(this);
		this._windowUpBound = this._windowUp.bind(this);
		this._windowKeyUpBound = this._windowKeyUp.bind(this);
		this._windowResizeBound = this._windowResize.bind(this);
	}

	reload() {
		let shadowRoot = this.options?.shadowRoot ?? document;

		if (this._menuElement == null) {
			this._menuElement = document.createElement("div");
			this._menuElement.className = "context_menu";
			this._menuElement.id = "cm_" + this.num;

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

		let lastWasDivider = false;
		level.forEach((item) => {
			let li = document.createElement("li");

			if (item.title !== '-') {
				let icon_span = document.createElement("span");
				icon_span.className = 'cm_icon_span';

				if ((item.icon ?? '') != '') {
					icon_span.innerHTML = item.icon;
				} else {
					icon_span.innerHTML = this.options?.defaultIcon ?? '';
				}

				let text_span = document.createElement("span");
				text_span.className = 'cm_text';

				text_span.innerHTML = item.title;

				let sub_span = document.createElement("span");
				sub_span.className = 'cm_sub_span';

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
					if (item.children != null) {
						li.appendChild(this.renderLevel(item.children));
					}
				}
				lastWasDivider = false;
				ul_outer.appendChild(li);
			} else {
				if (!lastWasDivider) {
					li.className = "cm_divider";
					lastWasDivider = true;
					ul_outer.appendChild(li);
				}
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
			menu.classList.add("cm_border_right");
		} else {
			menu.classList.remove("cm_border_right");
		}

		if ((windowHeight - clickCoordsY) < sizes.height) {
			menu.classList.add("cm_border_bottom");
		} else {
			menu.classList.remove("cm_border_bottom");
		}

		menu.classList.add("display");

		window.addEventListener("keyup", this._windowKeyUpBound);
		window.addEventListener("mousedown", this._windowDownBound);
		window.addEventListener("mouseup", this._windowUpBound);
		window.addEventListener("resize", this._windowResizeBound);

		event.preventDefault();
	}

	_windowResize() {
		this.close();
	}

	_windowDown(e: MouseEvent) {
		const p = e.composedPath();
		if (p.indexOf(this._menuElement) < 0)
			this.close();
	}

	_windowUp(e: MouseEvent) {
		const p = e.composedPath();
		if (p.indexOf(this._menuElement) < 0)
			this.close();
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
		window.removeEventListener("keyup", this._windowKeyUpBound);
		window.removeEventListener("mousedown", this._windowDownBound);
		window.removeEventListener("mouseup", this._windowUpBound);
		window.removeEventListener("resize", this._windowResizeBound);
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
