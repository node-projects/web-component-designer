import { IDesignItem } from '../../../item/IDesignItem.js';
import { CommonPropertiesService } from './CommonPropertiesService.js';
import { RefreshMode } from '../IPropertiesService.js';

export abstract class AbstractCssPropertiesService extends CommonPropertiesService {

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.none;
  }

  constructor() {
    super(false);
  }
}
