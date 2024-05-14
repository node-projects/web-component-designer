import { IElementAtPointService } from './IElementAtPointService.js';
import { IPoint } from '../../../interfaces/IPoint.js';
import { IDesignerCanvas } from '../../widgets/designerView/IDesignerCanvas.js';

export class ElementAtPointService implements IElementAtPointService {
  getElementAtPoint(designerCanvas: IDesignerCanvas, point: IPoint) {
    return designerCanvas.getElementAtPoint(point);
  }
}