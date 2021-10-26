import { IService } from "../IService";
import { IDesignerCanvas } from '../../widgets/designerView/IDesignerCanvas';
import { IPoint } from "../../../interfaces/IPoint";

export interface IElementAtPointService extends IService {
  getElementAtPoint(designerView: IDesignerCanvas, point: IPoint);
}