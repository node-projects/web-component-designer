import { IDesignerView } from "../../widgets/designerView/IDesignerView.js";

export interface IDragDropService {
  dragOver(event: DragEvent): 'none' | 'copy' | 'link' | 'move';
  drop(designerView: IDesignerView, event: DragEvent);
}