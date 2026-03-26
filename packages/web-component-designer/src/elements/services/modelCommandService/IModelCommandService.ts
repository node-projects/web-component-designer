import { IUiCommand } from '../../../commandHandling/IUiCommand.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../widgets/designerView/IDesignerCanvas.js';
import { IService } from '../IService.js';

export interface IModelCommandService extends IService {
  canExecuteCommand(designerCanvas: IDesignerCanvas, command: IUiCommand, designItems?: IDesignItem[]): boolean | null
  executeCommand(designerCanvas: IDesignerCanvas, commandType: IUiCommand, designItems?: IDesignItem[])
}