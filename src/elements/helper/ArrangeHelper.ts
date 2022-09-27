import { ChangeGroup, IDesignerCanvas, IDesignItem } from "../..";
import { Orientation } from "../../enums/Orientation";

export abstract class ArrangeHelper {
    public static arrangeElements(orientation: Orientation, designerCanvas: IDesignerCanvas) {
        switch (orientation) {
            case Orientation.TOP: {
                const grp = this.formGroup(ArrangeDirection.TOP, designerCanvas);

                const top = designerCanvas.instanceServiceContainer.selectionService.primarySelection.styles.get('top');
                for (let elem of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                    this.arrange(elem, 'top', top);
                }
                grp.commit();
                break;
            }
            case Orientation.RIGHT: {
                const grp = this.formGroup(ArrangeDirection.RIGHT, designerCanvas);

                const arrElement = designerCanvas.getNormalizedElementCoordinates(designerCanvas.instanceServiceContainer.selectionService.primarySelection.element);
                const right = Math.floor(arrElement.x + arrElement.width);
                for (let elem of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                    this.arrange(elem, 'left', <string><any>(right - Math.floor(designerCanvas.getNormalizedElementCoordinates(elem.element).width)) + "px")
                }
                grp.commit();
                break;
            }
            case Orientation.BOTTOM:
                const grp = this.formGroup(ArrangeDirection.BOTTOM, designerCanvas);

                const arrElement = designerCanvas.getNormalizedElementCoordinates(designerCanvas.instanceServiceContainer.selectionService.primarySelection.element);
                const top = Math.floor(arrElement.y + arrElement.height);
                for (let elem of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                    this.arrange(elem, 'top', <string><any>(top - Math.floor(designerCanvas.getNormalizedElementCoordinates(elem.element).height)) + "px");
                }
                grp.commit();
                break;

            case Orientation.LEFT: {
                const grp = this.formGroup(ArrangeDirection.LEFT, designerCanvas);

                const left = designerCanvas.instanceServiceContainer.selectionService.primarySelection.styles.get('left');
                for (let elem of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                    this.arrange(elem, 'left', left);
                }
                grp.commit();
                break;
            }
            case Orientation.VERTICAL_CENTER: {
                const grp = this.formGroup(ArrangeDirection.VERTICAL_CENTER, designerCanvas);

                const arrElement = designerCanvas.getNormalizedElementCoordinates(designerCanvas.instanceServiceContainer.selectionService.primarySelection.element);
                const ver_center = arrElement.y + arrElement.height / 2;
                for (let elem of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                    this.arrange(elem, 'top', <string><any>(ver_center - Math.floor(designerCanvas.getNormalizedElementCoordinates(elem.element).height) / 2) + "px");
                }
                grp.commit();
                break;
            }

            case Orientation.HORIZONTAL_CENTER: {
                const grp = this.formGroup(ArrangeDirection.HORIZONTAL_CENTER, designerCanvas);

                const arrElement = designerCanvas.getNormalizedElementCoordinates(designerCanvas.instanceServiceContainer.selectionService.primarySelection.element);
                const hor_center = arrElement.x + (arrElement.width / 2);
                for (let elem of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
                    this.arrange(elem, 'left', <string><any>(hor_center - Math.floor(designerCanvas.getNormalizedElementCoordinates(elem.element).width) / 2) + "px")
                }
                grp.commit();
                break;
            }
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
    TOP = 'arrangeTop',
    RIGHT = 'arrangeRight',
    BOTTOM = 'arrangeBottom',
    LEFT = 'arrangeLeft',
    HORIZONTAL_CENTER = 'arrangeHorizontalCenter',
    VERTICAL_CENTER = 'arrangeVerticalCenter',
}