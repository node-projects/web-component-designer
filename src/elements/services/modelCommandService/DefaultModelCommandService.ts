import { CommandType } from "../../../commandHandling/CommandType.js";
import { IUiCommand } from "../../../commandHandling/IUiCommand.js";
import { DesignItem } from "../../item/DesignItem.js";
import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { MoveElementInDomAction } from "../undoService/transactionItems/MoveElementInDomAction.js";
import { IModelCommandService } from "./IModelCommandService.js";


export class DefaultModelCommandService implements IModelCommandService {
  canExecuteCommand(designerCanvas: IDesignerCanvas, command: IUiCommand): boolean {
    if (command.type == CommandType.moveBackward ||
      command.type == CommandType.moveForward ||
      command.type == CommandType.moveToBack ||
      command.type == CommandType.moveToFront)
      return designerCanvas.instanceServiceContainer.selectionService.primarySelection != null;
    if (command.type == CommandType.arrangeBottom ||
      command.type == CommandType.arrangeCenter ||
      command.type == CommandType.arrangeLeft ||
      command.type == CommandType.arrangeMiddle ||
      command.type == CommandType.arrangeRight ||
      command.type == CommandType.arrangeTop ||
      command.type == CommandType.unifyHeight ||
      command.type == CommandType.unifyWidth)
      return designerCanvas.instanceServiceContainer.selectionService.selectedElements.length > 1;
    return null;
  }

  async executeCommand(designerCanvas: IDesignerCanvas, command: IUiCommand) {
    let sel = designerCanvas.instanceServiceContainer.selectionService.primarySelection;
    if (command.type == CommandType.moveBackward)
      designerCanvas.instanceServiceContainer.undoService.execute(new MoveElementInDomAction(sel, DesignItem.GetDesignItem((<HTMLElement>sel.element).previousElementSibling), 'beforebegin', DesignItem.GetDesignItem((<HTMLElement>sel.element).previousElementSibling), 'afterend'));
    else if (command.type == CommandType.moveForward)
      designerCanvas.instanceServiceContainer.undoService.execute(new MoveElementInDomAction(sel, DesignItem.GetDesignItem((<HTMLElement>sel.element).nextElementSibling), 'afterend', DesignItem.GetDesignItem((<HTMLElement>sel.element).nextElementSibling), 'beforebegin'));
    else if (command.type == CommandType.moveToBack)
      designerCanvas.instanceServiceContainer.undoService.execute(new MoveElementInDomAction(sel, DesignItem.GetDesignItem((<HTMLElement>sel.element).parentElement), 'afterbegin', DesignItem.GetDesignItem((<HTMLElement>sel.element).previousElementSibling), 'afterend'));
    else if (command.type == CommandType.moveToFront)
      designerCanvas.instanceServiceContainer.undoService.execute(new MoveElementInDomAction(sel, DesignItem.GetDesignItem((<HTMLElement>sel.element).parentElement), 'beforeend', DesignItem.GetDesignItem((<HTMLElement>sel.element).nextElementSibling), 'beforebegin'));
    else if (command.type == CommandType.arrangeLeft) {
      const grp = designerCanvas.instanceServiceContainer.selectionService.primarySelection.openGroup('arrangeLeft');
      const left = designerCanvas.instanceServiceContainer.selectionService.primarySelection.styles.get('left');
      for (let s of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
        s.setStyle('left', left);
      }
      grp.commit()
    }
    else if (command.type == CommandType.arrangeTop) {
      const grp = designerCanvas.instanceServiceContainer.selectionService.primarySelection.openGroup('arrangeTop');
      const top = designerCanvas.instanceServiceContainer.selectionService.primarySelection.styles.get('top');
      for (let s of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
        s.setStyle('top', top);
      }
      grp.commit();
    }
    else if (command.type == CommandType.unifyHeight) {
      const grp = designerCanvas.instanceServiceContainer.selectionService.primarySelection.openGroup('unifyHeight');
      const height = designerCanvas.instanceServiceContainer.selectionService.primarySelection.styles.get('height');
      for (let s of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
        s.setStyle('height', height);
      }
      grp.commit();
    }
    else if (command.type == CommandType.unifyWidth) {
      const grp = designerCanvas.instanceServiceContainer.selectionService.primarySelection.openGroup('unifyWidth');
      const width = designerCanvas.instanceServiceContainer.selectionService.primarySelection.styles.get('width');
      for (let s of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
        s.setStyle('width', width);
      }
      grp.commit();
    }
    else
      return null;
    return true;
  }
}