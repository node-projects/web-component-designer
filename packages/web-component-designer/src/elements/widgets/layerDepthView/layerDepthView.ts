import { BaseCustomWebComponentConstructorAppend, css, html, Disposable } from "@node-projects/base-custom-webcomponent";
import { InstanceServiceContainer } from "../../services/InstanceServiceContainer.js";
import { IDesignItem } from "../../item/IDesignItem.js";
import { NodeType } from "../../item/NodeType.js";
import { DesignerCanvas } from "../designerView/designerCanvas.js";
import { ILayerDepthView } from "./ILayerDepthView.js";

interface LayerDepthEntry {
  element: HTMLElement | SVGElement;
  depth: number;
}

export class LayerDepthView extends BaseCustomWebComponentConstructorAppend implements ILayerDepthView {

  static override readonly style = css`
        :host {
          overflow: hidden;
          display: block;
          width: 100%;
          height: 100%;
          position: relative;
          isolation: isolate;
          background: #f3f4f6;
          color: #111827;
          user-select: none;
          -webkit-user-select: none;
        }
        #viewport {
          position: absolute;
          inset: 0;
          overflow: hidden;
          cursor: grab;
          z-index: 0;
          perspective: 9000px;
        }
        #viewport.dragging {
          cursor: grabbing;
        }
        #scene {
          position: absolute;
          top: 50%;
          left: 50%;
          z-index: 0;
          transform-style: preserve-3d;
          transform-origin: center center;
        }
        #content {
          position: absolute;
          top: 0;
          left: 0;
          transform-style: preserve-3d;
          transform-origin: top left;
          pointer-events: none;
        }
        #content, #content * {
          transform-style: preserve-3d;
        }
        #empty {
          position: absolute;
          inset: 0;
          display: none;
          align-items: center;
          justify-content: center;
          color: #4b5563;
          font: 13px sans-serif;
          pointer-events: none;
        }
        #controls {
          position: absolute;
          left: 8px;
          right: 8px;
          top: 8px;
          z-index: 2147483647;
          display: grid;
          grid-template-columns: auto minmax(100px, 1fr) auto;
          align-items: center;
          gap: 8px;
          box-sizing: border-box;
          padding: 7px 9px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(17, 24, 39, 0.14);
          font: 12px sans-serif;
          pointer-events: auto;
          z-index: 1;
          position: relative;
        }
        #depthSlider {
          width: 100%;
          min-width: 0;
        }
        #depthValue {
          min-width: 42px;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }`;

  static override readonly template = html`
        <div id="controls">
          <span>Depth</span>
          <input id="depthSlider" type="range" min="0" max="120" step="1" value="36">
          <span id="depthValue">36px</span>
        </div>
        <div id="viewport">
          <div id="scene">
            <div id="content"></div>
          </div>
          <div id="empty">No layers</div>
        </div>`;

  private _viewport: HTMLDivElement;
  private _scene: HTMLDivElement;
  private _content: HTMLDivElement;
  private _empty: HTMLDivElement;
  private _depthSlider: HTMLInputElement;
  private _depthValue: HTMLSpanElement;
  private _instanceServiceContainer: InstanceServiceContainer;
  private _contentChangedHandler: Disposable;
  private _zoomFactorChangedHandler: Disposable;
  private _resizeObserver: ResizeObserver;
  private _reRenderFlag = false;
  private _maxX = 0;
  private _maxY = 0;
  private _depthSpacing = 36;
  private _rotateX = 0;
  private _rotateY = 0;
  private _translateX = 0;
  private _translateY = 0;
  private _scale = 1;
  private _layerDepthEntries: LayerDepthEntry[] = [];
  private _dragStart: {
    x: number;
    y: number;
    rotateX: number;
    rotateY: number;
    translateX: number;
    translateY: number;
    pan: boolean;
  };
  private _boundPointerMove: (event: PointerEvent) => void;
  private _boundPointerUp: (event: PointerEvent) => void;

  constructor() {
    super();
    this._restoreCachedInititalValues();

    this._viewport = this._getDomElement<HTMLDivElement>('viewport');
    this._scene = this._getDomElement<HTMLDivElement>('scene');
    this._content = this._getDomElement<HTMLDivElement>('content');
    this._empty = this._getDomElement<HTMLDivElement>('empty');
    this._depthSlider = this._getDomElement<HTMLInputElement>('depthSlider');
    this._depthValue = this._getDomElement<HTMLSpanElement>('depthValue');

    this._boundPointerMove = this._onPointerMove.bind(this);
    this._boundPointerUp = this._onPointerUp.bind(this);

    this._depthSlider.addEventListener('input', () => {
      this._depthSpacing = Number(this._depthSlider.value);
      this._depthValue.textContent = this._depthSpacing + 'px';
      this._updateLayerDepths();
    });
    this._viewport.addEventListener('pointerdown', event => this._onPointerDown(event));
    this._viewport.addEventListener('wheel', event => this._onWheel(event), { passive: false });
    this._viewport.addEventListener('contextmenu', event => event.preventDefault());

    this._resizeObserver = new ResizeObserver(() => this._fitScene());
  }

  ready() {
    this._resizeObserver.observe(this);
    this._applySceneTransform();
  }

  private _scheduleRender() {
    if (this._reRenderFlag === false) {
      this._reRenderFlag = true;
      setTimeout(() => this._reRender(), 50);
    }
  }

  private async _reRender() {
    if (!this._instanceServiceContainer) {
      return;
    }

    const designerCanvas = this._instanceServiceContainer.designerCanvas;
    this._copyAdoptedStyleSheets(designerCanvas.rootDesignItem);

    const pixelSize = designerCanvas.designerPixelSize;
    this._maxX = Math.max(pixelSize.width, 1);
    this._maxY = Math.max(pixelSize.height, 1);

    const layerTree = this._createLayerTree();
    this._content.replaceChildren(layerTree.fragment);
    this._scene.style.width = this._maxX + 'px';
    this._scene.style.height = this._maxY + 'px';
    this._content.style.width = this._maxX + 'px';
    this._content.style.height = this._maxY + 'px';
    this._empty.style.display = layerTree.count ? 'none' : 'flex';

    this._updateLayerDepths();
    this._fitScene();
    this._reRenderFlag = false;
  }

  private _copyAdoptedStyleSheets(rootDesignItem: IDesignItem) {
    const rootElement = rootDesignItem?.element;
    const usableContainer = rootDesignItem?.usableContainer;
    const root = rootElement?.shadowRoot ?? (usableContainer instanceof Document ? usableContainer : rootElement?.ownerDocument);
    this.shadowRoot.adoptedStyleSheets = root?.adoptedStyleSheets ? [...root.adoptedStyleSheets] : [];
  }

  private _createLayerTree(): { fragment: DocumentFragment, count: number } {
    const rootDesignItem = this._instanceServiceContainer.rootDesignItem;
    const fragment = document.createDocumentFragment();
    let count = 0;
    this._layerDepthEntries = [];

    for (const designItem of rootDesignItem.children()) {
      if (designItem.nodeType !== NodeType.Element) {
        continue;
      }

      const clone = designItem.element.cloneNode(true) as Element;
      fragment.appendChild(clone);
      count = this._prepareCloneTree(designItem, clone, count);
    }

    return { fragment, count };
  }

  private _prepareCloneTree(designItem: IDesignItem, clone: Element, layerIndex: number): number {
    this._prepareCloneElement(clone, layerIndex);
    layerIndex++;

    const originalChildNodes = Array.from(designItem.element.childNodes);
    const clonedChildNodes = Array.from(clone.childNodes);

    for (const childDesignItem of designItem.children()) {
      if (childDesignItem.nodeType !== NodeType.Element) {
        continue;
      }

      const childIndex = originalChildNodes.findIndex(node => node === childDesignItem.node);
      const childClone = clonedChildNodes[childIndex];
      if (childClone instanceof Element) {
        layerIndex = this._prepareCloneTree(childDesignItem, childClone, layerIndex);
      }
    }

    return layerIndex;
  }

  private _prepareCloneElement(clone: Element, layerIndex: number) {
    if (clone instanceof HTMLElement || clone instanceof SVGElement) {
      clone.style.transformStyle = 'preserve-3d';
      clone.style.willChange = 'translate';
      this._layerDepthEntries.push({
        element: clone,
        depth: layerIndex
      });
    }
  }

  private _updateLayerDepths() {
    this._depthValue.textContent = this._depthSpacing + 'px';
    if (!this._layerDepthEntries.length) {
      return;
    }
    const depths = this._layerDepthEntries.map(entry => entry.depth);
    const minDepth = Math.min(...depths);
    const maxDepth = Math.max(...depths);
    const depthRange = Math.max(maxDepth - minDepth, 1);
    const depthToZ = (depth: number) => ((depth - minDepth) / depthRange - 0.5) * this._depthSpacing * 2;
    const depthByElement = new Map<HTMLElement | SVGElement, number>();
    for (const entry of this._layerDepthEntries) {
      depthByElement.set(entry.element, entry.depth);
    }
    for (const entry of this._layerDepthEntries) {
      let parentElement = entry.element.parentElement;
      let parentDepth: number;
      while (parentElement) {
        parentDepth = depthByElement.get(parentElement);
        if (parentDepth !== undefined) {
          break;
        }
        parentElement = parentElement.parentElement;
      }
      const parentZ = parentDepth === undefined ? 0 : depthToZ(parentDepth);
      entry.element.style.translate = '0 0 ' + (depthToZ(entry.depth) - parentZ) + 'px';
    }
  }

  private _fitScene() {
    const viewportRect = this._viewport.getBoundingClientRect();
    if (!viewportRect.width || !viewportRect.height || !this._maxX || !this._maxY) {
      return;
    }

    const fitScale = Math.min(viewportRect.width / this._maxX, viewportRect.height / this._maxY) * 0.72;
    this._scale = Math.min(Math.max(fitScale, 0.05), 4);
    this._translateX = 0;
    this._translateY = 0;
    this._applySceneTransform();
  }

  private _applySceneTransform() {
    this._scene.style.transformStyle = 'preserve-3d';
    this._content.style.transformStyle = 'preserve-3d';
    this._scene.style.transform =
      'translate(-50%, -50%) ' +
      'translate(' + this._translateX + 'px, ' + this._translateY + 'px) ' +
      'scale(' + this._scale + ') ' +
      'rotateX(' + this._rotateX + 'deg) ' +
      'rotateY(' + this._rotateY + 'deg)';
    this._content.style.transform = '';
  }

  private _onPointerDown(event: PointerEvent) {
    if (event.target === this._depthSlider || event.button !== 0 && event.button !== 1 && event.button !== 2) {
      return;
    }

    this._dragStart = {
      x: event.clientX,
      y: event.clientY,
      rotateX: this._rotateX,
      rotateY: this._rotateY,
      translateX: this._translateX,
      translateY: this._translateY,
      pan: event.button === 1 || event.button === 2 || event.shiftKey
    };

    this._viewport.classList.add('dragging');
    this._viewport.setPointerCapture(event.pointerId);
    this._viewport.addEventListener('pointermove', this._boundPointerMove);
    this._viewport.addEventListener('pointerup', this._boundPointerUp);
    this._viewport.addEventListener('pointercancel', this._boundPointerUp);
    event.preventDefault();
  }

  private _onPointerMove(event: PointerEvent) {
    if (!this._dragStart) {
      return;
    }

    const dx = event.clientX - this._dragStart.x;
    const dy = event.clientY - this._dragStart.y;

    if (this._dragStart.pan) {
      this._translateX = this._dragStart.translateX + dx;
      this._translateY = this._dragStart.translateY + dy;
    } else {
      this._rotateY = this._dragStart.rotateY + dx * 0.35;
      this._rotateX = Math.min(85, Math.max(-85, this._dragStart.rotateX - dy * 0.35));
    }

    this._applySceneTransform();
    event.preventDefault();
  }

  private _onPointerUp(event: PointerEvent) {
    this._dragStart = null;
    this._viewport.classList.remove('dragging');
    this._viewport.releasePointerCapture(event.pointerId);
    this._viewport.removeEventListener('pointermove', this._boundPointerMove);
    this._viewport.removeEventListener('pointerup', this._boundPointerUp);
    this._viewport.removeEventListener('pointercancel', this._boundPointerUp);
  }

  private _onWheel(event: WheelEvent) {
    const scaleDelta = event.deltaY < 0 ? 1.08 : 0.92;
    this._scale = Math.min(6, Math.max(0.03, this._scale * scaleDelta));
    this._applySceneTransform();
    event.preventDefault();
  }

  public set instanceServiceContainer(value: InstanceServiceContainer) {
    this._contentChangedHandler?.dispose();
    this._zoomFactorChangedHandler?.dispose();
    this._instanceServiceContainer = value;
    if (this._instanceServiceContainer) {
      this._zoomFactorChangedHandler = (<DesignerCanvas>this._instanceServiceContainer.designerCanvas).onZoomFactorChanged.on(() => {
        this._scheduleRender();
      });
      this._contentChangedHandler = this._instanceServiceContainer.onContentChanged.on(() => {
        this._scheduleRender();
      });
      this._scheduleRender();
    } else {
      this._content.replaceChildren();
      this._layerDepthEntries = [];
      this._empty.style.display = 'flex';
    }
  }
}

customElements.define('node-projects-web-component-designer-layer-depth-view', LayerDepthView);
