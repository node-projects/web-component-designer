import { DefaultPlacementService, IDesignItem, IDesignerCanvas, IPoint, filterChildPlaceItems } from '@node-projects/web-component-designer';

export class ZplLayoutPlacementService extends DefaultPlacementService {

    constructor() {
        super();
    }

    override serviceForContainer(container: IDesignItem) {
        return true;
    }

    override canEnter(container: IDesignItem, items: IDesignItem[]) {
        return false;
    }

    override enterContainer(container: IDesignItem, items: IDesignItem[]) {
        let filterdItems = filterChildPlaceItems(items);
        for (let i of filterdItems) {
            container.insertChild(i);
        }
    }

    override leaveContainer(container: IDesignItem, items: IDesignItem[]) {
    }

    override finishPlace(event: MouseEvent, designerCanvas: IDesignerCanvas, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
        {
            super.finishPlace(event, designerCanvas, container, startPoint, offsetInControl, newPoint, items);
        }
    }
}
