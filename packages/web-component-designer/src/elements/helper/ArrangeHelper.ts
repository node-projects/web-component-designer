import { Orientation } from '../../enums/Orientation.js';
import { IDesignItem } from '../item/IDesignItem.js';
import { ChangeGroup } from '../services/undoService/ChangeGroup.js';
import { IDesignerCanvas } from '../widgets/designerView/IDesignerCanvas.js';

export abstract class ArrangeHelper {
    public static arrangeElements(orientation: Orientation, designerCanvas: IDesignerCanvas, arrangeElements: IDesignItem[]) {
        switch (orientation) {
            case Orientation.TOP: {
                const grp = this.formGroup(ArrangeDirection.TOP, designerCanvas);
                const primaryCoordinates = designerCanvas.getNormalizedElementCoordinates(arrangeElements[0].element);
                const targetY = primaryCoordinates.y;

                for (let elem of arrangeElements) {
                    let selectedCoordinates = designerCanvas.getNormalizedElementCoordinates(elem.element);
                    if (targetY != selectedCoordinates.y) {
                        let parent = designerCanvas.getNormalizedElementCoordinates(elem.parent.element);
                        if (elem.hasStyle('bottom') && !elem.hasStyle('top')) {
                            let bottom = parent.y + parent.height - targetY - selectedCoordinates.height;
                            this.arrange(elem, 'bottom', bottom + "px");
                        } else {
                            let top = targetY - parent.y;
                            this.arrange(elem, 'top', top + "px");
                        }
                    }
                }
                grp.commit();
                break;
            }
            case Orientation.BOTTOM: {
                const grp = this.formGroup(ArrangeDirection.BOTTOM, designerCanvas);
                const primaryCoordinates = designerCanvas.getNormalizedElementCoordinates(arrangeElements[0].element);
                const targetBottom = primaryCoordinates.y + primaryCoordinates.height;

                for (let elem of arrangeElements) {
                    let selectedCoordinates = designerCanvas.getNormalizedElementCoordinates(elem.element);
                    if (targetBottom != selectedCoordinates.y + selectedCoordinates.height) {
                        let parent = designerCanvas.getNormalizedElementCoordinates(elem.parent.element);
                        if (elem.hasStyle('bottom') && !elem.hasStyle('top')) {
                            let bottom = parent.y + parent.height - targetBottom;
                            this.arrange(elem, 'bottom', bottom + "px");
                        } else {
                            let top = targetBottom - selectedCoordinates.height - parent.y;
                            this.arrange(elem, 'top', top + "px");
                        }
                    }
                }
                grp.commit();
                break;
            }
            case Orientation.LEFT: {
                const grp = this.formGroup(ArrangeDirection.LEFT, designerCanvas);
                const primaryCoordinates = designerCanvas.getNormalizedElementCoordinates(arrangeElements[0].element);
                const targetX = primaryCoordinates.x;

                for (let elem of arrangeElements) {
                    let selectedCoordinates = designerCanvas.getNormalizedElementCoordinates(elem.element);
                    if (targetX != selectedCoordinates.x) {
                        let parent = designerCanvas.getNormalizedElementCoordinates(elem.parent.element);
                        if (elem.hasStyle('right') && !elem.hasStyle('left')) {
                            let right = parent.x + parent.width - targetX - selectedCoordinates.width;
                            this.arrange(elem, 'right', right + "px");
                        } else {
                            let left = targetX - parent.x;
                            this.arrange(elem, 'left', left + "px");
                        }
                    }
                }
                grp.commit();
                break;
            }
            case Orientation.RIGHT: {
                const grp = this.formGroup(ArrangeDirection.RIGHT, designerCanvas);
                const primaryCoordinates = designerCanvas.getNormalizedElementCoordinates(arrangeElements[0].element);
                const targetRight = primaryCoordinates.x + primaryCoordinates.width;

                for (let elem of arrangeElements) {
                    let selectedCoordinates = designerCanvas.getNormalizedElementCoordinates(elem.element);
                    if (targetRight != selectedCoordinates.x + selectedCoordinates.width) {
                        let parent = designerCanvas.getNormalizedElementCoordinates(elem.parent.element);
                        if (elem.hasStyle('right') && !elem.hasStyle('left')) {
                            let right = parent.x + parent.width - targetRight;
                            this.arrange(elem, 'right', right + "px");
                        } else {
                            let left = targetRight - selectedCoordinates.width - parent.x;
                            this.arrange(elem, 'left', left + "px");
                        }
                    }
                }
                grp.commit();
                break;
            }
            case Orientation.VERTICAL_CENTER: {
                const grp = this.formGroup(ArrangeDirection.VERTICAL_CENTER, designerCanvas);
                const primaryCoordinates = designerCanvas.getNormalizedElementCoordinates(arrangeElements[0].element);
                const targetCenterY = primaryCoordinates.y + primaryCoordinates.height / 2;

                for (let elem of arrangeElements) {
                    let selectedCoordinates = designerCanvas.getNormalizedElementCoordinates(elem.element);
                    if (targetCenterY != selectedCoordinates.y + selectedCoordinates.height / 2) {
                        let parent = designerCanvas.getNormalizedElementCoordinates(elem.parent.element);
                        if (elem.hasStyle('bottom') && !elem.hasStyle('top')) {
                            let bottom = parent.y + parent.height - targetCenterY - selectedCoordinates.height / 2;
                            this.arrange(elem, 'bottom', bottom + "px");
                        } else {
                            let top = targetCenterY - selectedCoordinates.height / 2 - parent.y;
                            this.arrange(elem, 'top', top + "px");
                        }
                    }
                }
                grp.commit();
                break;
            }

            case Orientation.HORIZONTAL_CENTER: {
                const grp = this.formGroup(ArrangeDirection.HORIZONTAL_CENTER, designerCanvas);
                const primaryCoordinates = designerCanvas.getNormalizedElementCoordinates(arrangeElements[0].element);
                const targetCenterX = primaryCoordinates.x + primaryCoordinates.width / 2;

                for (let elem of arrangeElements) {
                    let selectedCoordinates = designerCanvas.getNormalizedElementCoordinates(elem.element);
                    if (targetCenterX != selectedCoordinates.x + selectedCoordinates.width / 2) {
                        let parent = designerCanvas.getNormalizedElementCoordinates(elem.parent.element);
                        if (elem.hasStyle('right') && !elem.hasStyle('left')) {
                            let right = parent.x + parent.width - targetCenterX - selectedCoordinates.width / 2;
                            this.arrange(elem, 'right', right + "px");
                        } else {
                            let left = targetCenterX - selectedCoordinates.width / 2 - parent.x;
                            this.arrange(elem, 'left', left + "px");
                        }
                    }
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
