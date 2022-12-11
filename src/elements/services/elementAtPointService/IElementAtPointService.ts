import { IService } from '../IService.js';
import { IDesignerCanvas } from '../../widgets/designerView/IDesignerCanvas.js';
import { IPoint } from '../../../interfaces/IPoint.js';

export interface IElementAtPointService extends IService {
  getElementAtPoint(designerView: IDesignerCanvas, point: IPoint);
}