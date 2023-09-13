import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { IExternalDragDropService } from "./IExternalDragDropService.js";
import { DesignItem } from '../../item/DesignItem.js';
import { InsertAction } from "../undoService/transactionItems/InsertAction.js";

export class ExternalDragDropService implements IExternalDragDropService {

  public dragOver(event: DragEvent): 'none' | 'copy' | 'link' | 'move' {
    if (event.dataTransfer.items[0].type.startsWith('image/'))
      return 'copy';
    return 'none';
  }

  async drop(designerCanvas: IDesignerCanvas, event: DragEvent) {
    if (event.dataTransfer.files[0].type.startsWith('image/')) {
      let di = await DesignItem.createDesignItemFromImageBlob(designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer, event.dataTransfer.files[0]);
      let grp = di.openGroup("Insert of &lt;img&gt;");
      di.setStyle('position', 'absolute')
      const targetRect = (<HTMLElement>event.target).getBoundingClientRect();
      di.setStyle('top', event.offsetY + targetRect.top - designerCanvas.containerBoundingRect.y + 'px')
      di.setStyle('left', event.offsetX + targetRect.left - designerCanvas.containerBoundingRect.x + 'px')
      designerCanvas.instanceServiceContainer.undoService.execute(new InsertAction(designerCanvas.rootDesignItem, designerCanvas.rootDesignItem.childCount, di));
      grp.commit();
      requestAnimationFrame(() => designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([di]));
    }
  }
}