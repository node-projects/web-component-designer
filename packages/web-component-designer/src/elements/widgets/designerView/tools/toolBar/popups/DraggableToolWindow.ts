import { BaseCustomWebComponentConstructorAppend, css, html } from '@node-projects/base-custom-webcomponent';

/**
 * A reusable draggable tool window with a title bar and close button.
 * Subclasses override `title` and provide content via the `windowContent` slot
 * by overriding `windowTemplate` and `windowStyle`.
 *
 * Usage:
 *   - Extend this class and override `windowTitle`, `windowTemplate`, and `windowStyle`.
 *   - The subclass template is inserted into the `.window-content` slot area.
 *   - To show: call `DraggableToolWindow.show(instance, anchorElement?)` or append to document.body.
 */
export abstract class DraggableToolWindow extends BaseCustomWebComponentConstructorAppend {

  static override readonly style = css`
    :host {
      position: fixed;
      display: block;
      z-index: 9999;
      min-width: 200px;
      user-select: none;
      touch-action: none;
    }
    .window-frame {
      background: #2c2c2c;
      border: 1px solid #111;
      border-radius: 4px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.7);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .title-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #1a1a1a;
      padding: 2px 5px;
      cursor: move;
      flex-shrink: 0;
      height: 18px;
      box-sizing: border-box;
    }
    .title-text {
      color: #ccc;
      font-size: 11px;
      font-family: sans-serif;
      font-weight: 500;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .close-btn {
      width: 14px;
      height: 14px;
      background: none;
      border: none;
      color: #888;
      font-size: 12px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 2px;
      flex-shrink: 0;
    }
    .close-btn:hover {
      background: #c0392b;
      color: #fff;
    }
    .window-content {
      overflow: auto;
    }
  `;

  static override readonly template = html`
    <div class="window-frame">
      <div class="title-bar" id="title-bar">
        <span class="title-text" id="title-text"></span>
        <button class="close-btn" id="close-btn" title="Close">&#x2715;</button>
      </div>
      <div class="window-content" id="window-content"></div>
    </div>
  `;

  /** Override in subclass to set the window title. */
  protected abstract get windowTitle(): string;

  /** Override in subclass to return the inner content template. */
  protected abstract get windowTemplate(): HTMLTemplateElement | string;

  /** Override in subclass to return additional styles for the content. */
  protected get windowContentStyle(): CSSStyleSheet | null { return null; }

  private _dragging = false;
  private _dragOffsetX = 0;
  private _dragOffsetY = 0;

  private _titleBar: HTMLElement;
  private _titleText: HTMLElement;
  private _closeBtn: HTMLButtonElement;
  private _contentArea: HTMLElement;

  constructor() {
    super();

    this._titleBar = this._getDomElement<HTMLElement>('title-bar');
    this._titleText = this._getDomElement<HTMLElement>('title-text');
    this._closeBtn = this._getDomElement<HTMLButtonElement>('close-btn');
    this._contentArea = this._getDomElement<HTMLElement>('window-content');

    this._titleText.textContent = this.windowTitle;

    // Inject content
    const tpl = this.windowTemplate;
    if (typeof tpl === 'string') {
      const temp = document.createElement('template');
      temp.innerHTML = tpl;
      this._contentArea.appendChild(temp.content.cloneNode(true));
    } else {
      this._contentArea.appendChild(tpl.content.cloneNode(true));
    }

    // Apply optional extra styles to shadow root
    const extraStyle = this.windowContentStyle;
    if (extraStyle) {
      this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, extraStyle];
    }

    this._closeBtn.onclick = () => this._close();

    // Drag via pointer events on title bar
    this._titleBar.addEventListener('pointerdown', (e: PointerEvent) => this._onPointerDown(e));
  }

  connectedCallback() {
    // Default position near top-left if not already placed
    if (!this.style.left && !this.style.top) {
      this.style.left = '100px';
      this.style.top = '100px';
    }
  }

  private _close() {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    this.remove();
  }

  private _onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return;
    if (e.target === this._closeBtn) return;
    e.preventDefault();
    this._dragging = true;
    const rect = this.getBoundingClientRect();
    this._dragOffsetX = e.clientX - rect.left;
    this._dragOffsetY = e.clientY - rect.top;
    this._titleBar.setPointerCapture(e.pointerId);
    this._titleBar.addEventListener('pointermove', this._onPointerMove);
    this._titleBar.addEventListener('pointerup', this._onPointerUp);
  }

  private _onPointerMove = (e: PointerEvent) => {
    if (!this._dragging) return;
    let x = e.clientX - this._dragOffsetX;
    let y = e.clientY - this._dragOffsetY;
    // Keep within viewport
    x = Math.max(0, Math.min(x, window.innerWidth - 40));
    y = Math.max(0, Math.min(y, window.innerHeight - 30));
    this.style.left = x + 'px';
    this.style.top = y + 'px';
  };

  private _onPointerUp = (e: PointerEvent) => {
    this._dragging = false;
    this._titleBar.releasePointerCapture(e.pointerId);
    this._titleBar.removeEventListener('pointermove', this._onPointerMove);
    this._titleBar.removeEventListener('pointerup', this._onPointerUp);
  };

  /**
   * Show the tool window anchored near a reference element, or centered if none.
   * Appends to document.body.
   */
  static showWindow(instance: DraggableToolWindow, anchor?: Element) {
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      instance.style.left = (rect.right + 8) + 'px';
      instance.style.top = rect.top + 'px';
    } else {
      instance.style.left = Math.max(0, (window.innerWidth - 260) / 2) + 'px';
      instance.style.top = '120px';
    }
    document.body.appendChild(instance);
  }
}
