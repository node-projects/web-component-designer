import { EventNames } from '../../../../enums/EventNames.js';
import { DesignItem } from '../../../item/DesignItem.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { InsertAction } from '../../../services/undoService/transactionItems/InsertAction.js';
import { ExtensionType } from '../extensions/ExtensionType.js';
import { IDesignerCanvas } from '../IDesignerCanvas';
import { ITool } from './ITool';

export class TextTool implements ITool {

  constructor() {
  }

  activated(serviceContainer: ServiceContainer) {
  }

  dispose(): void {
  }

  readonly cursor = 'text';

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    const currentPoint = designerCanvas.getNormalizedEventCoordinates(event);


    switch (event.type) {
      case EventNames.PointerDown:
        const span = document.createElement('span')
        const di = DesignItem.createDesignItemFromInstance(span, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
        di.setStyle('position', 'absolute');
        di.setStyle('left', currentPoint.x + 'px');
        di.setStyle('top', currentPoint.y + 'px');
        designerCanvas.instanceServiceContainer.undoService.execute(new InsertAction(designerCanvas.rootDesignItem, designerCanvas.rootDesignItem.childCount, di));
        designerCanvas.serviceContainer.globalContext.finishedWithTool(this);

        //TODO - don't apply doubleclick extension (maybe it is not the doubleclick one) - apply edit text extesion directly
        designerCanvas.extensionManager.applyExtension(di, ExtensionType.Doubleclick);
        setTimeout(() => {
          span.focus();
        }, 50);
        break;

    }
  }

  keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent, currentElement: Element) { }
}