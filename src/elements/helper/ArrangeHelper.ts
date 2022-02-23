import { ChangeGroup, IDesignerCanvas, IDesignItem } from "../..";
import { Orientation } from "../../enums/Orientation";

export abstract class ArrangeHelper {
    public static arrangeElements(orientation: Orientation, designerCanvas: IDesignerCanvas) {
        switch (orientation) {
            case Orientation.TOP:
                var grp = this.formGroup(ArrangeDirection.TOP, designerCanvas);

                var top = designerCanvas.instanceServiceContainer.selectionService.primarySelection.styles.get('top');
                for (let elem of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                    this.arrange(elem, 'top', top);
                }
                grp.commit();
                break;

            case Orientation.RIGHT:
                var grp = this.formGroup(ArrangeDirection.RIGHT, designerCanvas);

                var arrElement = designerCanvas.getNormalizedElementCoordinates(designerCanvas.instanceServiceContainer.selectionService.primarySelection.element);
                var right = Math.floor(arrElement.x + arrElement.width);
                for (let elem of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                    this.arrange(elem, 'left', <string><any>(right - Math.floor(designerCanvas.getNormalizedElementCoordinates(elem.element).width)) + "px")
                }
                grp.commit();
                break;

            case Orientation.BOTTOM:
                break;

            case Orientation.LEFT:
                var grp = this.formGroup(ArrangeDirection.LEFT, designerCanvas);

                var left = designerCanvas.instanceServiceContainer.selectionService.primarySelection.styles.get('left');
                for (let elem of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                    this.arrange(elem, 'left', left);
                }
                grp.commit();
                break;

            case Orientation.VERTICAL_CENTER:
                break;

            case Orientation.HORIZONTAL_CENTER:
                break;
        }
    }

    private static arrange(element: IDesignItem, attribut: string, value: string) {
        element.setStyle(attribut, value);
    }

    private static formGroup(name: string, designerCanvas: IDesignerCanvas): ChangeGroup {
        return designerCanvas.instanceServiceContainer.selectionService.primarySelection.openGroup(name);
    }
}

enum ArrangeDirection {
    RIGHT = 'arrangeRight',
    LEFT = 'arrangeLeft',
    TOP = 'arrangeTop',
}