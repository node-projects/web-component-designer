import { DefaultPlacementService, IDesignItem, IPoint, filterChildPlaceItems } from '@node-projects/web-component-designer';
import { IPlacementView } from '@node-projects/web-component-designer/dist/elements/widgets/designerView/IPlacementView';

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

    override finishPlace(event: MouseEvent, placementView: IPlacementView, container: IDesignItem, startPoint: IPoint, offsetInControl: IPoint, newPoint: IPoint, items: IDesignItem[]) {
        {
            super.finishPlace(event, placementView, container, startPoint, offsetInControl, newPoint, items);
        }
    }
}
