import { css, html, BaseCustomWebComponentConstructorAppend } from '@node-projects/base-custom-webcomponent';
import { OverlayLayer } from './extensions/OverlayLayer.js';
import { ServiceContainer } from '../../services/ServiceContainer';

export class OverlayLayerView extends BaseCustomWebComponentConstructorAppend {

  static override readonly template = html`
    <svg id="svg" style="pointer-events: none;">
      <g id="background"></g>
      <g id="normal"></g>
      <g id="foreground"></g>
    </svg>`;


  static override readonly style = css`
    svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .svg-snapline { stroke: purple; stroke-dasharray: 4; fill: transparent; }
    .svg-selector { stroke: black; fill: #3899ec55; stroke-width: 1; stroke-dasharray: 2; }
    .svg-primary-selection-move { stroke: #3899ec; fill: #3899ec; cursor: move; pointer-events: all }
    .svg-text { stroke: none; fill: white; stroke-width: 1; font-size: 10px; font-family: monospace; }
    .svg-primary-resizer { stroke: #3899ec; fill: white; pointer-events: all }
    .svg-position  { stroke: black; stroke-dasharray: 2; }
    .svg-path { stroke: #3899ec; fill: orange; pointer-events: all }
    .svg-path-line { stroke: #3899ec; stroke-dasharray: 2; }
    .svg-draw-new-element { stroke: black; fill: transparent; stroke-width: 1; }`;

  static readonly is = 'node-projects-overlay-layer-view';

  private _serviceContainer: ServiceContainer;
  private _svg: SVGElement;
  private _gBackground: SVGGElement;
  private _gNormal: SVGGElement;
  private _gForeground: SVGGElement;

  constructor(serviceContainer: ServiceContainer) {
    super();

    this._serviceContainer = serviceContainer;
    this._svg = this._getDomElement<SVGElement>('svg');
    this._gBackground = this._getDomElement<SVGGElement>('background');
    this._gNormal = this._getDomElement<SVGGElement>('normal');
    this._gForeground = this._getDomElement<SVGGElement>('foreground');

    this._initialize();
  }

  private _initialize() {
    let styles: CSSStyleSheet[] = [OverlayLayerView.style];
    for (const extList of this._serviceContainer.designerExtensions) {
      for (const ext of extList[1]) {
        if (ext.style) {
          styles.push(ext.style);
        }
      }
    }

    this.shadowRoot.adoptedStyleSheets = styles;
  }

  public addOverlay(element: SVGGraphicsElement, overlayLayer: OverlayLayer = OverlayLayer.Normal) {
    switch (overlayLayer) {
      case OverlayLayer.Background:
        this._gBackground.appendChild(element);
        break;
      case OverlayLayer.Foregorund:
        this._gForeground.appendChild(element);
        break;
      default:
        this._gNormal.appendChild(element);
        break;
    }
  }

  public removeOverlay(element: SVGGraphicsElement) {
    try {
      if (element)
        element.parentElement.removeChild(element);
    } catch (err) {
      console.error(err);
    }
  }

  public removeAllNodesWithClass(className: string) {
    const nodes = this._svg.querySelectorAll('.' + className);
    for (const e of nodes) {
      e.parentNode.removeChild(e);
    }
  }

  public createPoint(): DOMPointInit {
    //@ts-ignore
    return this._svg.createSVGPoint();
  }

  public elementFromPoint(x: number, y: number): Element {
    //@ts-ignore
    return this.shadowRoot.elementFromPoint(x, y);
  }
}

customElements.define(OverlayLayerView.is, OverlayLayerView);