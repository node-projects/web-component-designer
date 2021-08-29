import { IElementAtPointService } from './IElementAtPointService';
import { IDesignerView } from '../../..';
import { IPoint } from '../../../interfaces/IPoint';

export class ElementAtPointService implements IElementAtPointService {
  getElementAtPoint(designerView: IDesignerView, point: IPoint) {
    return designerView.getElementAtPoint(point);
  }
}