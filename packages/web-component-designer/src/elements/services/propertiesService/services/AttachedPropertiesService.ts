import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { AbstractPropertiesService } from './AbstractPropertiesService.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IPropertyGroup } from '../IPropertyGroup.js';

export class AttachedPropertiesService extends AbstractPropertiesService {

  public name = "attached"

  override getRefreshMode(designItem: IDesignItem): RefreshMode {
    return RefreshMode.full;
  }

  override isHandledElement(designItem: IDesignItem): boolean {
    return designItem.serviceContainer.forSomeServicesTillResult('attachedPropertyService', x => x.isHandledElement(designItem));
  }

  override async getProperties(designItem: IDesignItem): Promise<IProperty[] | IPropertyGroup[]> {
    let p: IProperty[] | IPropertyGroup[] = [];
    if (designItem.serviceContainer.attachedPropertyServices) {
      for (let s of designItem.serviceContainer.attachedPropertyServices) {
        if (s.isHandledElement(designItem)) {
          p.push(...<any>(await s.getProperties(designItem)));
        }
      }
    }
    return p;
  }
}