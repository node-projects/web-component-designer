import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { PropertyType } from '../PropertyType.js';
import { AbstractPropertiesService } from './AbstractPropertiesService.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IPropertyGroup } from '../IPropertyGroup.js';
import { ValueType } from '../ValueType.js';

export class ContentAndIdPropertiesService extends AbstractPropertiesService {

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.none;
  }

  public contentProperty: IProperty =
    {
      name: "content",
      type: "string",
      service: this,
      propertyType: PropertyType.complex
    };

  public idProperty: IProperty =
    {
      name: "id",
      type: "string",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    };

  public name = "content"

  override isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  override getProperty(designItem: IDesignItem, name: string): IProperty {
    return name == 'id' ? this.idProperty : this.contentProperty;
  }

  override getProperties(designItem: IDesignItem): IProperty[] | IPropertyGroup[] {
    return [this.idProperty, this.contentProperty];
  }

  override clearValue(designItems: IDesignItem[], property: IProperty): void {
    if (property.name == 'content') {
      designItems[0].clearChildren();
    } else {
      super.clearValue(designItems, property);
    }
  }

  override isSet(designItems: IDesignItem[], property: IProperty): ValueType {
    if (property.name == 'content') {
      let all = true;
      let some = false;
      if (designItems != null && designItems.length !== 0) {

        designItems.forEach((x) => {
          let has = false;
          has = x.element.childNodes.length > 0;
          all = all && has;
          some = some || has;
        });
        //todo: optimize perf, do not call bindings service for each property. 
        /*const bindings = designItems[0].serviceContainer.forSomeServicesTillResult('bindingService', (s) => {
          return s.getBindings(designItems[0]);
        });
        if (property.propertyType == PropertyType.cssValue) {
          if (bindings && bindings.find(x => x.target == BindingTarget.css && x.targetName == property.name))
            return ValueType.bound;
        } else {
          if (bindings && bindings.find(x => x.target == BindingTarget.property && x.targetName == property.name))
            return ValueType.bound;
        }*/
      }
      return all ? ValueType.all : some ? ValueType.some : ValueType.none;
    }
    return super.isSet(designItems, property);
  }

  override getValue(designItems: IDesignItem[], property: IProperty): string | boolean {
    if (property.name == 'content') {
      return designItems[0].element.textContent;
    }
    return super.getValue(designItems, property);
  }
}
