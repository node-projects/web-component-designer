import { CommandType } from "../../../commandHandling/CommandType.js";
import { IUiCommand } from "../../../commandHandling/IUiCommand.js";
import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { IModelCommandService } from "./IModelCommandService.js";
import { ArrangeHelper } from "../../helper/ArrangeHelper.js";
import { Orientation } from "../../../enums/Orientation.js";


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
    if (command.type == CommandType.moveBackward) {
      let idx = sel.parent.indexOf(sel) - 1;
      if (idx >= 0)
        sel.parent.insertChild(sel, idx);
    }
    else if (command.type == CommandType.moveForward) {
      let idx = sel.parent.indexOf(sel) + 1;
      if (idx < sel.parent.childCount)
        sel.parent.insertChild(sel, idx);
    }
    else if (command.type == CommandType.moveToBack)
      sel.parent.insertChild(sel, 0);
    else if (command.type == CommandType.moveToFront)
      sel.parent.insertChild(sel);
    else if (command.type == CommandType.arrangeTop) {
      ArrangeHelper.arrangeElements(Orientation.TOP, designerCanvas);
    }
    else if (command.type == CommandType.arrangeRight) {
      ArrangeHelper.arrangeElements(Orientation.RIGHT, designerCanvas);
    }
    else if (command.type == CommandType.arrangeLeft) {
      ArrangeHelper.arrangeElements(Orientation.LEFT, designerCanvas);
    }
    else if (command.type == CommandType.arrangeBottom){
      ArrangeHelper.arrangeElements(Orientation.BOTTOM, designerCanvas);
    }
    else if (command.type == CommandType.arrangeCenter) {
      ArrangeHelper.arrangeElements(Orientation.HORIZONTAL_CENTER, designerCanvas);
    }
    else if (command.type == CommandType.arrangeMiddle) {
      ArrangeHelper.arrangeElements(Orientation.VERTICAL_CENTER, designerCanvas);
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
    else if(command.type == CommandType.rotateLeft){
      const grp = designerCanvas.instanceServiceContainer.selectionService.primarySelection.openGroup('rotateLeft');
      var trf = designerCanvas.instanceServiceContainer.selectionService.primarySelection.styles.get('transform');

      if(trf != null){
        if(trf.includes('-'))
          var degree = parseInt(trf.match(/\d+/)[0]) * -1;
        else
          var degree = parseInt(trf.match(/\d+/)[0]);

        var rotation = "rotate(" + (degree - 90) + "deg)";
      }
      else
      {
        var rotation = "rotate(-90deg)";
      }
      for (let s of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
        s.setStyle('transform', rotation);
      }
      grp.commit();
    }
    else if(command.type == CommandType.rotateRight){
      const grp = designerCanvas.instanceServiceContainer.selectionService.primarySelection.openGroup('rotateRight');
      var trf = designerCanvas.instanceServiceContainer.selectionService.primarySelection.styles.get('transform');

      if(trf != null){
        if(trf.includes('-'))
          var degree = parseInt(trf.match(/\d+/)[0]) * -1;
        else
          var degree = parseInt(trf.match(/\d+/)[0]);

        var rotation = "rotate(" + (degree - 90) + "deg)";
      }
      else
      {
        var rotation = "rotate(90deg)";
      }
      for (let s of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
        s.setStyle('transform', rotation);
      }
      grp.commit();
    }
    else
      return null;
    return true;
  }
}