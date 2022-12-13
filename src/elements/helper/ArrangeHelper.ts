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

                for (let elem of arrangeElements) {        
                    let selectedCoordinates = designerCanvas.getNormalizedElementCoordinates(elem.element);
                    if(primaryCoordinates.y != selectedCoordinates.y) {
                        let parent = designerCanvas.getNormalizedElementCoordinates(elem.parent.element);
                        let top = primaryCoordinates.y - parent.y;
                        this.arrange(elem, 'top', top + "px" );
                    }
                }
                grp.commit();
                break;
            }
            case Orientation.RIGHT: {
                const grp = this.formGroup(ArrangeDirection.RIGHT, designerCanvas);
                const primaryCoordinates = designerCanvas.getNormalizedElementCoordinates(arrangeElements[0].element);

                for (let elem of arrangeElements) {        
                    let selectedCoordinates = designerCanvas.getNormalizedElementCoordinates(elem.element);
                    if(primaryCoordinates.x != selectedCoordinates.x) {
                        let parent = designerCanvas.getNormalizedElementCoordinates(elem.parent.element);
                        let right = primaryCoordinates.x - parent.x;
                        this.arrange(elem, 'left', right + "px" );
                    }
                }
                grp.commit();
                break;
            }
            case Orientation.BOTTOM:
                const grp = this.formGroup(ArrangeDirection.BOTTOM, designerCanvas);
                const primaryCoordinates = designerCanvas.getNormalizedElementCoordinates(arrangeElements[0].element);

                for (let elem of arrangeElements) {        
                    let selectedCoordinates = designerCanvas.getNormalizedElementCoordinates(elem.element);
                    if(primaryCoordinates.y != selectedCoordinates.y) {
                        let parent = designerCanvas.getNormalizedElementCoordinates(elem.parent.element);
                        let bottom = primaryCoordinates.y - parent.y;
                        this.arrange(elem, 'top', bottom + "px" );
                    }
                }
                grp.commit();
                break;

            case Orientation.LEFT: {
                const grp = this.formGroup(ArrangeDirection.LEFT, designerCanvas);
                const primaryCoordinates = designerCanvas.getNormalizedElementCoordinates(arrangeElements[0].element);

                for (let elem of arrangeElements) {        
                    let selectedCoordinates = designerCanvas.getNormalizedElementCoordinates(elem.element);
                    if(primaryCoordinates.x != selectedCoordinates.x){
                        let parent = designerCanvas.getNormalizedElementCoordinates(elem.parent.element);
                        let left = primaryCoordinates.x - parent.x;
                        this.arrange(elem, 'left', left + "px" );
                    }
                }
                grp.commit();
                break;
            }
            case Orientation.VERTICAL_CENTER: {
                const grp = this.formGroup(ArrangeDirection.VERTICAL_CENTER, designerCanvas);
                const primaryCoordinates =  designerCanvas.getNormalizedElementCoordinates(arrangeElements[0].element);

                for (let elem of arrangeElements) {        
                    let selectedCoordinates = designerCanvas.getNormalizedElementCoordinates(elem.element);
                    if(primaryCoordinates.y != selectedCoordinates.y) {
                        let parent = designerCanvas.getNormalizedElementCoordinates(elem.parent.element);
                        let center = primaryCoordinates.y - parent.y + (primaryCoordinates.height / 2) - (selectedCoordinates.height / 2);
                        this.arrange(elem, 'top', center + "px" );
                    }
                }
                grp.commit();
                break;
            }

            case Orientation.HORIZONTAL_CENTER: {
                const grp = this.formGroup(ArrangeDirection.HORIZONTAL_CENTER, designerCanvas);
                const primaryCoordinates = designerCanvas.getNormalizedElementCoordinates(arrangeElements[0].element);

                for (let elem of arrangeElements) {        
                    let selectedCoordinates = designerCanvas.getNormalizedElementCoordinates(elem.element);
                    if(primaryCoordinates.x != selectedCoordinates.x) {
                        let parent = designerCanvas.getNormalizedElementCoordinates(elem.parent.element);
                        let center = primaryCoordinates.x - parent.x + (primaryCoordinates.width / 2) - (selectedCoordinates.width / 2);
                        this.arrange(elem, 'left', center + "px" );
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