import { IUiCommand } from '../../../commandHandling/IUiCommand.js';
import { IDesignerCanvas } from '../../widgets/designerView/IDesignerCanvas.js';
import { IService } from '../IService';

export interface IModelCommandService extends IService {
  canExecuteCommand(designerCanvas: IDesignerCanvas, command: IUiCommand): boolean | null
  executeCommand(designerCanvas: IDesignerCanvas, command: IUiCommand)
}