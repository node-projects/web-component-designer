import { EventNames } from '../../../../enums/EventNames.js';
import { interpolateLinePoints, moveSVGPath, straightenLine } from '../../../helper/PathDataPolyfill.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { ITool } from './ITool.js';
import { OverlayLayer } from '../extensions/OverlayLayer.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { IPoint } from '../../../../interfaces/IPoint.js';
import { roundNumericParts, roundValueToDecimalPlaces } from '../extensions/svg/geometry/GeometryWriteHelper.js';
import { applySvgDrawingStyle, insertSvgDrawing } from './SvgDrawingHelper.js';
import { mountSvgToolbar } from '../extensions/svg/SvgToolbarHost.js';
import { SvgPointSnapping } from '../extensions/svg/SvgPointSnapping.js';

type optionsType = {
  angleStep?: number;
  freehand?: boolean;
  strokeColor?: string;
  fillBrush?: string;
  strokeThickness?: string;
  interpolatePoints?: boolean;
  interpolationDistance?: number;
};

export class DrawPathTool implements ITool {
  readonly cursor = 'crosshair';
  private _canvas?: IDesignerCanvas;
  private _path?: SVGPathElement;
  private _points: IPoint[] = [];
  private _down?: IPoint;
  private _freehand = false;
  private _polyline = false;
  private _captureElement?: Element;
  private _pointerId?: number;
  private _snapping?: SvgPointSnapping;
  private _toolbar?: HTMLDivElement;
  private _removeToolbar?: () => void;
  private _previewPoint?: IPoint;

  constructor(private options?: optionsType) {}
  activated(serviceContainer: ServiceContainer) {}
  dispose() { this.cleanup(); }

  pointerEventHandler(canvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    if (event.type === EventNames.PointerDown && event.button !== 0) return;
    let point = canvas.getNormalizedEventCoordinates(event);
    if (event.type === EventNames.PointerDown) {
      canvas.clickOverlay.focus();
      if (!this._path) {
        this._canvas = canvas;
        this._snapping = new SvgPointSnapping(canvas);
        point = this._snapping.snap(point, [], event.altKey);
        this._points = [point];
        this._path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        applySvgDrawingStyle(this._path, canvas.serviceContainer.globalContext, this.options);
        canvas.overlayLayer.addOverlay(this.constructor.name, this._path, OverlayLayer.Foreground);
        canvas.captureActiveTool(this);
        this.createToolbar();
      }
      this._down = point;
      this._captureElement = event.target as Element;
      this._pointerId = event.pointerId;
      this._captureElement.setPointerCapture(event.pointerId);
    } else if (event.type === EventNames.PointerMove && this._path) {
      this._previewPoint = point;
      if (this.options?.freehand !== false && !this._polyline && this._down && event.buttons === 1 &&
        this.distance(this._down, point) * canvas.zoomFactor > 3) this._freehand = true;
      if (this._freehand && event.buttons === 1) {
        const last = this._points[this._points.length - 1];
        this._points.push(...(this.options?.interpolatePoints
          ? interpolateLinePoints(last, point, this.options.interpolationDistance ?? 5) : [point]));
        this.render();
      } else if (this._polyline || this.options?.freehand === false) this.render(this.snapPoint(point, event));
    } else if (event.type === EventNames.PointerUp && this._path && this._down) {
      this.releaseCapture();
      if (this._freehand) {
        if (this.distance(this._points[this._points.length - 1], point) > 0) this._points.push(point);
        this.finish();
      } else if (!this._polyline) {
        this._polyline = true;
        if (this.options?.freehand === false && this.distance(point, this._points[0]) * canvas.zoomFactor > 4) this._points.push(this.snapPoint(point, event));
        this.render();
      } else {
        point = this.snapPoint(point, event);
        if (this._points.length >= 3 && this.distance(point, this._points[0]) * canvas.zoomFactor <= 6) this.finish(true);
        else {
          // The second click of a double-click must not add another endpoint.
          if (this.distance(point, this._points[this._points.length - 1]) * canvas.zoomFactor > 4) this._points.push(point);
          this.render();
        }
      }
      this._down = undefined;
    } else if (event.type === 'pointercancel') this.cancel();
    event.preventDefault();
    event.stopPropagation();
  }

  doubleClickEventHandler(canvas: IDesignerCanvas, event: MouseEvent) {
    if (this._path) this.finish();
    event.preventDefault();
    event.stopPropagation();
  }

  keyboardEventHandler(canvas: IDesignerCanvas, event: KeyboardEvent) {
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key) && this._polyline && this._previewPoint) {
      this.render(this.snapPoint(this._previewPoint, event));
      event.preventDefault();
      return;
    }
    if (event.type !== 'keydown') return;
    if (event.key === 'Enter') this.finish();
    else if (event.key === 'Escape') this.cancel();
    else if ((event.key === 'Backspace' || event.key === 'Delete') && this._points.length > 1) {
      this._points.pop();
      this.render();
    } else return;
    event.preventDefault();
    event.stopPropagation();
  }

  private distance(a: IPoint, b: IPoint) { return Math.hypot(a.x - b.x, a.y - b.y); }

  private snapPoint(point: IPoint, event: Pick<KeyboardEvent, 'shiftKey' | 'altKey'>): IPoint {
    const last = this._points[this._points.length - 1];
    if (!event.altKey && (event.shiftKey || this.options?.angleStep)) {
      this._snapping?.clear();
      return straightenLine(last, point, this.options?.angleStep ?? 45);
    }
    const middle = this._points.length > 1 ? [{
      x: (Math.min(...this._points.map(p => p.x)) + Math.max(...this._points.map(p => p.x))) / 2,
      y: (Math.min(...this._points.map(p => p.y)) + Math.max(...this._points.map(p => p.y))) / 2
    }] : [];
    const midpoints = this._points.slice(1).map((point, index) => ({
      x: (point.x + this._points[index].x) / 2, y: (point.y + this._points[index].y) / 2
    }));
    return this._snapping!.snap(point, [...middle, ...midpoints, ...this._points], event.altKey);
  }

  private pathData() { return this._points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' '); }

  private render(preview?: IPoint) {
    this._path?.setAttribute('d', this.pathData() + (preview ? ` L ${preview.x} ${preview.y}` : ''));
    if (this._toolbar) {
      (this._toolbar.querySelector('[data-action="finish"]') as HTMLButtonElement).disabled = this._points.length < 2;
      (this._toolbar.querySelector('[data-action="close"]') as HTMLButtonElement).disabled = this._points.length < 3;
    }
  }

  private createToolbar() {
    const toolbar = this._toolbar = document.createElement('div');
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('data-svg-toolbar', '');
    toolbar.setAttribute('aria-label', 'Path drawing');
    toolbar.style.cssText = 'position:absolute;top:8px;left:8px;z-index:10;display:flex;align-items:center;gap:6px;padding:6px;background:var(--wcd-tool-popup-background,#fff);color:var(--wcd-color-foreground,#222);border:1px solid var(--wcd-color-border,#888);font:12px sans-serif;pointer-events:auto';
    toolbar.innerHTML = '<span>Click nodes or drag to sketch · Shift: 45° · Alt: no snapping</span><button data-action="finish">Finish (Enter)</button><button data-action="close">Close path</button><button data-action="cancel">Cancel (Esc)</button>';
    toolbar.onpointerdown = event => { this._canvas!.ignoreEvent(event); event.stopPropagation(); };
    toolbar.ondblclick = event => event.stopPropagation();
    toolbar.onclick = event => {
      event.stopPropagation();
      const action = (event.target as HTMLElement).dataset.action;
      if (action === 'finish') this.finish();
      else if (action === 'close') this.finish(true);
      else if (action === 'cancel') this.cancel();
    };
    this._removeToolbar = mountSvgToolbar(this._canvas!, toolbar);
    this.render();
  }

  private finish(close = false) {
    const canvas = this._canvas;
    if (!canvas || !this._path || this._points.length < (close ? 3 : 2)) return;
    const path = this._path;
    path.setAttribute('d', this.pathData() + (close ? ' Z' : ''));
    const coords = canvas.getNormalizedElementCoordinates(path);
    const left = coords.x - 10, top = coords.y - 10;
    const decimals = canvas.serviceContainer.options.roundPixelsToDecimalPlaces;
    path.setAttribute('d', roundNumericParts(moveSVGPath(path, left, top), decimals));
    path.removeAttribute('overlay-source');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = `position:absolute;left:${roundValueToDecimalPlaces(left, decimals)}px;top:${roundValueToDecimalPlaces(top, decimals)}px;width:${Math.max(20, Math.ceil(coords.width + 20))}px;height:${Math.max(20, Math.ceil(coords.height + 20))}px;overflow:visible`;
    applySvgDrawingStyle(svg, canvas.serviceContainer.globalContext, this.options);
    canvas.overlayLayer.removeOverlay(path);
    path.removeAttribute('style');
    svg.append(path);
    this._path = undefined;
    this.cleanup();
    insertSvgDrawing(canvas, svg, 'Draw path');
  }

  private cancel() {
    const canvas = this._canvas;
    this.cleanup();
    if (canvas) canvas.serviceContainer.globalContext.finishedWithTool(this);
  }

  private releaseCapture() {
    if (this._captureElement && this._pointerId != null) {
      try { this._captureElement.releasePointerCapture(this._pointerId); } catch { /* Capture may already have ended. */ }
    }
    this._captureElement = undefined;
    this._pointerId = undefined;
  }

  private cleanup() {
    this.releaseCapture();
    if (this._path) this._canvas?.overlayLayer.removeOverlay(this._path);
    this._removeToolbar?.();
    this._removeToolbar = undefined;
    this._snapping?.clear();
    this._canvas?.releaseActiveTool();
    this._path = undefined;
    this._toolbar = undefined;
    this._snapping = undefined;
    this._canvas = undefined;
    this._points = [];
    this._previewPoint = undefined;
    this._down = undefined;
    this._polyline = false;
    this._freehand = false;
  }
}
