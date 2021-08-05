import { IService } from "../IService";
import { IDesignerView } from '../../widgets/designerView/IDesignerView';
import { IPoint } from '../../../../dist/interfaces/IPoint';

export interface IElementAtPointService extends IService {
  getElementAtPoint(designerView: IDesignerView, point: IPoint);
}