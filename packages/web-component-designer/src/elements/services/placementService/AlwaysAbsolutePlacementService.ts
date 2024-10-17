import type { IDesignItem } from '../../item/IDesignItem.js';
import { AbsolutePlacementService } from './AbsolutePlacementService.js';

export class AlwaysAbsolutePlacementService extends AbsolutePlacementService {
  override serviceForContainer(container: IDesignItem, containerStyle: CSSStyleDeclaration, item?: IDesignItem) {
    return true;
  }
}