import { IElementAtPointService } from './IElementAtPointService';
import { IDesignerCanvas } from '../../..';
import { IPoint } from '../../../interfaces/IPoint';

export class ElementAtPointService implements IElementAtPointService {
  getElementAtPoint(designerView: IDesignerCanvas, point: IPoint) {
    return designerView.getElementAtPoint(point);
  }
}