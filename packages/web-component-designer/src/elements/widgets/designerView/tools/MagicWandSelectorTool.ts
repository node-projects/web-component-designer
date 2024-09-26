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
        this._path.setAttribute("D", this._pathD);
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

        let point: DOMPointInit = designerCanvas.overlayLayer.createPoint();
        for (let e of elements) {
          let elementRect = designerCanvas.getNormalizedElementCoordinates(e);
          point.x = elementRect.x;
          point.y = elementRect.y;
          const p1 = this._path.isPointInFill(point) || this._path.isPointInStroke(point);
          point.x = elementRect.x + elementRect.width;
          point.y = elementRect.y;
          const p2 = this._path.isPointInFill(point) || this._path.isPointInStroke(point);
          point.x = elementRect.x;
          point.y = elementRect.y + elementRect.height;
          const p3 = this._path.isPointInFill(point) || this._path.isPointInStroke(point);
          point.x = elementRect.x + elementRect.width;
          point.y = elementRect.y + elementRect.height;
          const p4 = this._path.isPointInFill(point) || this._path.isPointInStroke(point);
          if (p1 && p2 && p3 && p4) {
            const desItem = DesignItem.GetOrCreateDesignItem(e, e, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
            if (!inSelectionElements.includes(desItem) && !event.altKey) {
              inSelectionElements.push(desItem);
            } else if (event.altKey) {
              const idx = inSelectionElements.indexOf(desItem);
              inSelectionElements.splice(idx, 1)
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

  keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent, currentElement: Element) { }

  activated(serviceContainer: ServiceContainer) {
  }

  dispose(): void {
  }
}