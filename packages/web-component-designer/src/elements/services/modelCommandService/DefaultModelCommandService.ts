import { CommandType } from "../../../commandHandling/CommandType.js";
import { IUiCommand } from "../../../commandHandling/IUiCommand.js";
import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { IModelCommandService } from "./IModelCommandService.js";
import { ArrangeHelper } from "../../helper/ArrangeHelper.js";
import { Orientation } from "../../../enums/Orientation.js";
import { IDesignItem } from "../../item/IDesignItem.js";

export class DefaultModelCommandService implements IModelCommandService {
  canExecuteCommand(designerCanvas: IDesignerCanvas, command: IUiCommand, designItems?: IDesignItem[]): boolean {
    if (command.type == CommandType.moveBackward ||
      command.type == CommandType.moveForward ||
      command.type == CommandType.moveToBack ||
      command.type == CommandType.moveToFront)
      return designerCanvas.instanceServiceContainer.selectionService.primarySelection != null && !designerCanvas.instanceServiceContainer.selectionService.primarySelection.isRootItem;
    if (command.type == CommandType.arrangeBottom ||
      command.type == CommandType.arrangeCenter ||
      command.type == CommandType.arrangeLeft ||
      command.type == CommandType.arrangeMiddle ||
      command.type == CommandType.arrangeRight ||
      command.type == CommandType.arrangeTop ||
      command.type == CommandType.unifyHeight ||
      command.type == CommandType.unifyWidth)
      return designerCanvas.instanceServiceContainer.selectionService.selectedElements.length > 1;
    if (command.type == CommandType.rotateCounterClockwise ||
      command.type == CommandType.rotateClockwise ||
      command.type == CommandType.mirrorHorizontal ||
      command.type == CommandType.mirrorVertical)
      return designerCanvas.instanceServiceContainer.selectionService.selectedElements.length > 0 && !designerCanvas.instanceServiceContainer.selectionService.primarySelection.isRootItem;
    return null;
  }

  async executeCommand(designerCanvas: IDesignerCanvas, command: IUiCommand, designItems?: IDesignItem[]) {
    designItems = designItems ?? [...designerCanvas.instanceServiceContainer.selectionService.selectedElements];
    const primary = designItems[0]  ;
    
    if (command.type == CommandType.moveBackward) {
      let idx = primary.parent.indexOf(primary) - 1;
      if (idx >= 0)
        primary.parent.insertChild(primary, idx);
    } else if (command.type == CommandType.moveForward) {
      let idx = primary.parent.indexOf(primary) + 1;
      if (idx < primary.parent.childCount)
        primary.parent.insertChild(primary, idx);
    } else if (command.type == CommandType.moveToBack) {
      primary.parent.insertChild(primary, 0);
    } else if (command.type == CommandType.moveToFront) {
      primary.parent.insertChild(primary);
    } else if (command.type == CommandType.arrangeTop) {
      ArrangeHelper.arrangeElements(Orientation.TOP, designerCanvas, designItems);
    } else if (command.type == CommandType.arrangeRight) {
      ArrangeHelper.arrangeElements(Orientation.RIGHT, designerCanvas, designItems);
    } else if (command.type == CommandType.arrangeLeft) {
      ArrangeHelper.arrangeElements(Orientation.LEFT, designerCanvas, designItems);
    } else if (command.type == CommandType.arrangeBottom) {
      ArrangeHelper.arrangeElements(Orientation.BOTTOM, designerCanvas, designItems);
    } else if (command.type == CommandType.arrangeCenter) {
      ArrangeHelper.arrangeElements(Orientation.HORIZONTAL_CENTER, designerCanvas, designItems);
    } else if (command.type == CommandType.arrangeMiddle) {
      ArrangeHelper.arrangeElements(Orientation.VERTICAL_CENTER, designerCanvas, designItems);
    } else if (command.type == CommandType.unifyHeight) {
      const grp = primary.openGroup('unifyHeight');
      const height = primary.getStyle('height');
      for (let s of designItems) {
        s.setStyle('height', height);
      }
      grp.commit();
    } else if (command.type == CommandType.unifyWidth) {
      const grp = primary.openGroup('unifyWidth');
      const width = primary.getStyle('width');
      for (let s of designItems) {
        s.setStyle('width', width);
      }
      grp.commit();
    } else if (command.type == CommandType.rotateCounterClockwise) {
      const grp = primary.openGroup('rotateCounterClockwise');
      var trf = primary.getStyle('transform');
      let degree = 0;
      let rotation = "";
      if (trf != null) {
        try {
          if (trf.includes('-'))
            degree = parseInt(trf.match(/\d+/)[0]) * -1;
          else
            degree = parseInt(trf.match(/\d+/)[0]);

          rotation = "rotate(" + (degree - 90) + "deg)";
        }
        catch {
          rotation = "rotate(-90deg)"
        }
      }
      else {
        rotation = "rotate(-90deg)";
      }
      for (let s of designItems) {
        s.setStyle('transform', rotation);
      }
      grp.commit();
    } else if (command.type == CommandType.rotateClockwise) {
      const grp = primary.openGroup('rotateClockwise');
      var trf = primary.getStyle('transform');
      let degree = 0;
      let rotation = "";
      if (trf != null) {
        try {
          if (trf.includes('-'))
            degree = parseInt(trf.match(/\d+/)[0]) * -1;
          else
            degree = parseInt(trf.match(/\d+/)[0]);

          rotation = "rotate(" + (degree + 90) + "deg)";
        }
        catch {
          rotation = "rotate(90deg)"
        }
      }
      else {
        rotation = "rotate(90deg)";
      }
      for (let s of designItems) {
        s.setStyle('transform', rotation);
      }
      grp.commit();
    } else if (command.type == CommandType.mirrorHorizontal) {
      const grp = primary.openGroup('mirrorHorizontal');
      for (let s of designItems) {
        s.setStyle('transform', 'scaleX(-1)');
      }
      grp.commit();
    } else if (command.type == CommandType.mirrorVertical) {
      const grp = primary.openGroup('mirrorVertical');
      for (let s of designItems) {
        s.setStyle('transform', 'scaleY(-1)');
      }
      grp.commit();
    } else
      return null;

    return true;
  }
}

//TODO: combine transforms, could be easy, add new transform, get the matrix and convert back to simple ones (if possible)