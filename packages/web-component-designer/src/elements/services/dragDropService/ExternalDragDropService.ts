import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { IExternalDragDropService } from "./IExternalDragDropService.js";
import { DesignItem } from '../../item/DesignItem.js';

export class ExternalDragDropService implements IExternalDragDropService {

  public dragOver(designerCanvas: IDesignerCanvas, event: DragEvent): 'none' | 'copy' | 'link' | 'move' {
    if (designerCanvas.readOnly)
          return 'none';
    if (event.dataTransfer.items[0].type.startsWith('image/'))
      return 'copy';
    return 'none';
  }

  async drop(designerCanvas: IDesignerCanvas, event: DragEvent) {
    if (event.dataTransfer.files[0].type.startsWith('image/')) {
      let di = await DesignItem.createDesignItemFromImageBlob(designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer, event.dataTransfer.files[0]);
      let grp = di.openGroup("Insert of &lt;img&gt;");
      di.setStyle('position', 'absolute')
      const coord = designerCanvas.getNormalizedEventCoordinates(event);
      di.setStyle('top', coord.y + 'px')
      di.setStyle('left', coord.x + 'px')
      designerCanvas.rootDesignItem.insertChild(di, designerCanvas.rootDesignItem.childCount);
      grp.commit();
      requestAnimationFrame(() => designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([di]));
    }
  }
}