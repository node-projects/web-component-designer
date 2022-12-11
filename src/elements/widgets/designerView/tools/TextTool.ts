import { EventNames } from '../../../../enums/EventNames.js';
import { DesignItem } from '../../../item/DesignItem.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { InsertAction } from '../../../services/undoService/transactionItems/InsertAction.js';
import { handlesPointerEvent } from '../extensions/EditText/EditTextExtension.js';
import { ExtensionType } from '../extensions/ExtensionType.js';
import { IDesignerExtension } from '../extensions/IDesignerExtension.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { ITool } from './ITool.js';

export class TextTool implements ITool {

  private _textEditExtensions: IDesignerExtension[];

  constructor(editExistingText?: boolean) {
    if (editExistingText)
      this._editExistingText = true;
  }

  activated(serviceContainer: ServiceContainer) {
    this._textCreated = false;
  }

  dispose(): void {
  }

  readonly cursor = 'text';

  private _textCreated = false;
  private _editExistingText = false;

  pointerEventHandler(designerCanvas: IDesignerCanvas, event: PointerEvent, currentElement: Element) {
    const currentPoint = designerCanvas.getNormalizedEventCoordinates(event);

    switch (event.type) {
      case EventNames.PointerDown:
        if (!this._textCreated && !this._editExistingText) {
          this._textCreated = true;
          const span = document.createElement('span')
          const di = DesignItem.createDesignItemFromInstance(span, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
          di.setStyle('position', 'absolute');
          di.setStyle('left', currentPoint.x + 'px');
          di.setStyle('top', currentPoint.y + 'px');
          designerCanvas.instanceServiceContainer.undoService.execute(new InsertAction(designerCanvas.rootDesignItem, designerCanvas.rootDesignItem.childCount, di));
          //todo: Maybe we could also remove the eatEvents property

          //TODO - don't apply doubleclick extension (maybe it is not the doubleclick one) - apply edit text extesion directly
          //should we configure the editTextExtension anywhere??
          this._textEditExtensions = designerCanvas.extensionManager.applyExtension(di, ExtensionType.Doubleclick);

          setTimeout(() => { span.focus(); }, 50);
        } else {
          for (let e of this._textEditExtensions) {
            if ((<handlesPointerEvent><unknown>e).handlesPointerEvent) {
              const ret = (<handlesPointerEvent><unknown>e).handlesPointerEvent(designerCanvas, event, currentElement);
              if (!ret) {
                designerCanvas.serviceContainer.globalContext.finishedWithTool(this);
              }
            }
          }
        }
        break;

    }
  }

  keyboardEventHandler(designerCanvas: IDesignerCanvas, event: KeyboardEvent, currentElement: Element) { }
}