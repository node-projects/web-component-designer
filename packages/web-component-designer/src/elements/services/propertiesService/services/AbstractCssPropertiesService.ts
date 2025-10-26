import { IDesignItem } from '../../../item/IDesignItem.js';
import { CommonPropertiesService } from './CommonPropertiesService.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IProperty } from '../IProperty.js';
import { PropertiesHelper } from './PropertiesHelper.js';

export abstract class AbstractCssPropertiesService extends CommonPropertiesService {

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.none;
  }

  async previewValue?(designItems: IDesignItem[], property: IProperty, value: any): Promise<void> {
    let nm = property.propertyName ?? property.name;
    if (!nm.startsWith('--'))
      nm = PropertiesHelper.camelToDashCase(nm);
    for (let d of designItems) {
      (<HTMLElement>d.element).style.setProperty(nm, value);
    }
  }

  async removePreviewValue?(designItems: IDesignItem[], property: IProperty): Promise<void> {
    let nm = property.propertyName ?? property.name;
    if (!nm.startsWith('--'))
      nm = PropertiesHelper.camelToDashCase(nm);
    for (let d of designItems) {
      if (d.hasStyle(nm))
        (<HTMLElement>d.element).style.setProperty(nm, d.getStyle(nm));
      else
        (<HTMLElement>d.element).style.setProperty(nm, '');
    }
  }

  constructor() {
    super(false);
  }
}
