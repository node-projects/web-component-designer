import { IDesignItem } from '../item/IDesignItem.js';

export function switchContainer(items: IDesignItem[], newContainer: IDesignItem, resizeNewContainer: boolean = false, newContainerOffset: number = 0) {
    //todo...
    //- switch to other containers? like grid, flexbox, ...
    //- position non absolute, or absolute from bottom or right

    for (let i of items) {
        if (i == newContainer || i.element.contains(newContainer.element)) {
            console.warn('could not move items into of itself or a child');
            return;
        }
    }
    
    const firstItem = items[0];
    const grp = firstItem.openGroup('switchContainerHelper');

    const designerCanvas = firstItem.instanceServiceContainer.designerCanvas;

    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = 0;
    let maxY = 0;
    for (let e of items) {
        let rect = designerCanvas.getNormalizedElementCoordinates(e.element);
        if (rect.x < minX)
            minX = rect.x;
        if (rect.y < minY)
            minY = rect.y;
        if (rect.x + rect.width > maxX)
            maxX = rect.x + rect.width;
        if (rect.y + rect.height > maxY)
            maxY = rect.y + rect.height;
    }

    let rectNewContainer = designerCanvas.getNormalizedElementCoordinates(newContainer.element);

    for (let e of items) {
        let rect = designerCanvas.getNormalizedElementCoordinates(e.element);
        e.remove();
        if (resizeNewContainer) {
            e.setStyle('left', (rect.x - minX + newContainerOffset).toString() + 'px');
            e.setStyle('top', (rect.y - minY + newContainerOffset).toString() + 'px');
        } else {
            e.setStyle('left', (rect.x - rectNewContainer.x).toString() + 'px');
            e.setStyle('top', (rect.y - rectNewContainer.y).toString() + 'px');
        }
        newContainer.insertChild(e);
    }
    if (resizeNewContainer) {
        newContainer.setStyle('position', 'absolute');
        newContainer.setStyle('left', (minX - newContainerOffset).toString() + 'px');
        newContainer.setStyle('top', (minY - newContainerOffset).toString() + 'px');
        newContainer.setStyle('width', (maxX - minX + 2 * newContainerOffset).toString() + 'px');
        newContainer.setStyle('height', (maxY - minY + 2 * newContainerOffset).toString() + 'px');
    }

    grp.commit();
}

