import { EventNames } from '../../../../enums/EventNames.js';
import { hasCommandKey } from '../../../helper/KeyboardHelper.js';
import { DesignItem } from '../../../item/DesignItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { OverlayLayer } from '../extensions/OverlayLayer.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { ITool } from './ITool.js';

export class MagicWandSelectorTool implements ITool {
  cursor: string = 'progress';

  private _pathD: string;
  private _path: SVGPathElement;

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    if (hasCommandKey(event))
      this.cursor = 'copy';
    else if (event.altKey)
      this.cursor = 'default';
    else
      this.cursor = 'default';

    const currentPoint = designerCanvas.getNormalizedEventCoordinates(event);

    switch (event.type) {
      case EventNames.PointerDown:
        (<Element>event.target).setPointerCapture(event.pointerId);
        designerCanvas.captureActiveTool(this);

        this._path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this._path.setAttribute('class', 'svg-selector');
        this._path.style.strokeWidth = '' + (1 / designerCanvas.scaleFactor);
        this._path.style.strokeDasharray = '' + (2 / designerCanvas.scaleFactor);
        this._pathD = "M" + currentPoint.x + " " + currentPoint.y;
        this._path.setAttribute("d", this._pathD);
        designerCanvas.overlayLayer.addOverlay(this.constructor.name, this._path, OverlayLayer.Foreground);
        break;

      case EventNames.PointerMove:
        if (this._path) {
          this._pathD += "L" + currentPoint.x + " " + currentPoint.y;
          this._path.setAttribute("d", this._pathD + "Z");
        }
        break;

      case EventNames.PointerUp:
        (<Element>event.target).releasePointerCapture(event.pointerId);
        designerCanvas.releaseActiveTool();

        const elements = designerCanvas.rootDesignItem.querySelectorAll('*');
        const inSelectionElements: IDesignItem[] = [];

        if ((hasCommandKey(event) || event.altKey) && designerCanvas.instanceServiceContainer.selectionService.selectedElements)
          inSelectionElements.push(...designerCanvas.instanceServiceContainer.selectionService.selectedElements);

        for (let e of elements) {
          if (this._containsElement(designerCanvas, e)) {
            const desItem = DesignItem.GetOrCreateDesignItem(e, e, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
            if (!inSelectionElements.includes(desItem) && !event.altKey) {
              inSelectionElements.push(desItem);
            } else if (event.altKey) {
              const idx = inSelectionElements.indexOf(desItem);
              if (idx >= 0) inSelectionElements.splice(idx, 1)
            }
          }
        }

        designerCanvas.overlayLayer.removeOverlay(this._path);
        this._path = null;
        this._pathD = null;

        designerCanvas.instanceServiceContainer.selectionService.setSelectedElements(inSelectionElements);

        designerCanvas.serviceContainer.globalContext.finishedWithTool(this);
        break;
    }
  }

  private _containsElement(canvas: IDesignerCanvas, element: Element): boolean {
    const inside = (point: DOMPointInit) => this._path.isPointInFill(point) || this._path.isPointInStroke(point);
    const win = element.ownerDocument.defaultView ?? window;
    if (canvas.serviceContainer.options.svgEditingMode === 'content' && element instanceof win.SVGElement) {
      // Select painted content, never its page-sized layer or definition resources.
      if (!(element instanceof win.SVGGraphicsElement) || element instanceof win.SVGSVGElement || element instanceof win.SVGGElement
        || element.closest('defs,marker,clipPath,mask,pattern,symbol')) return false;
      const style = win.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      if (element instanceof win.SVGGeometryElement) {
        if (style.fill === 'none' && style.stroke === 'none') return false;
        const screen = element.getScreenCTM(), lasso = this._path.getScreenCTM();
        if (!screen || !lasso) return false;
        const matrix = lasso.inverse().multiply(screen);
        const length = element.getTotalLength();
        if (!(length > 0)) return false;
        // Sample in screen units so curves and transformed paths retain the same
        // containment tolerance at every zoom. Empty bounding-box corners are irrelevant.
        const samples = Math.max(1, Math.ceil(length * Math.hypot(screen.a, screen.b, screen.c, screen.d) / 2));
        for (let i = 0; i <= samples; i++) {
          if (!inside(element.getPointAtLength(length * i / samples).matrixTransform(matrix))) return false;
        }
        return true;
      }
    }
    const rect = canvas.getNormalizedElementCoordinates(element);
    return inside({ x: rect.x, y: rect.y }) && inside({ x: rect.x + rect.width, y: rect.y })
      && inside({ x: rect.x, y: rect.y + rect.height }) && inside({ x: rect.x + rect.width, y: rect.y + rect.height });
  }

  keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent, currentElement: Element) { }

  activated(serviceContainer: ServiceContainer) {
  }

  dispose(): void {
  }
}