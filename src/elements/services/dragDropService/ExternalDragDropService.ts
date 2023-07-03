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

  drop(designerView: IDesignerCanvas, event: DragEvent) {
    if (event.dataTransfer.files[0].type.startsWith('image/')) {
      let reader = new FileReader();
      reader.onloadend = () => {
        const img = document.createElement('img');
        img.src = <string>reader.result;
        const di = DesignItem.createDesignItemFromInstance(img, designerView.serviceContainer, designerView.instanceServiceContainer);
        let grp = di.openGroup("Insert of &lt;img&gt;");
        di.setStyle('position', 'absolute')
        const targetRect = (<HTMLElement>event.target).getBoundingClientRect();
        di.setStyle('top', event.offsetY + targetRect.top - designerView.containerBoundingRect.y + 'px')
        di.setStyle('left', event.offsetX + targetRect.left - designerView.containerBoundingRect.x + 'px')
        designerView.instanceServiceContainer.undoService.execute(new InsertAction(designerView.rootDesignItem, designerView.rootDesignItem.childCount, di));
        grp.commit();
        requestAnimationFrame(() => designerView.instanceServiceContainer.selectionService.setSelectedElements([di]));
      }
      reader.readAsDataURL(event.dataTransfer.files[0]);
    }
  }
}