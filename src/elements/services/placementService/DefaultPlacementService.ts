/*
import { IPoint } from '../../../interfaces/IPoint.js';
import { IContainerService } from './IContainerService.js';
import { IDesignItem } from '../../../../dist/elements/item/IDesignItem';

export class DefaultPlacementService implements IContainerService {

  //todo: we should be able to switch what we change 
  //(margin, absolute/relative position, order in flexbox)
  serviceForContainer(container: IDesignItem) {
    return true;
  }

  canEnter(container: IDesignItem, items: IDesignItem[]) {
    return true;
  }

  canLeave(container: IDesignItem, items: IDesignItem[]) {
    return true;
  }


  place(container: IDesignItem, startPoint: IPoint, newPoint: IPoint, items: IDesignItem[]) {
    //todo, this should revert all undo actions while active
    //maybe a undo actions returns itself or an id so it could be changed?
    throw new Error("Method not implemented.");
  }

  finishPlace(container: IDesignItem, startPoint: IPoint, newPoint: IPoint, items: IDesignItem[]) {
    throw new Error("Method not implemented.");
  }
}
*/