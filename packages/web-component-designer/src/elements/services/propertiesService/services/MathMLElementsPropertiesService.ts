import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { CommonPropertiesService } from './CommonPropertiesService.js';
import { PropertyType } from '../PropertyType.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IPropertyGroup } from '../IPropertyGroup.js';

export class MathMLElementsPropertiesService extends CommonPropertiesService {

  private commonMathProperties: IProperty[] = [
    {
      name: "displaystyle",
      type: "boolean",
      service: this,
      defaultValue: true,
      propertyType: PropertyType.propertyAndAttribute
    }
  ];

  private mathProperties: IProperty[] = [
    {
      name: "display",
      type: "list",
      values: ["block", "inline"],
      service: this,
      defaultValue: "text",
      propertyType: PropertyType.propertyAndAttribute
    }
  ];

  private mfracProperties: IProperty[] = [
    {
      name: "denomalign",
      type: "list",
      values: ["left", "center", "right"],
      service: this,
      defaultValue: "center",
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "linethickness",
      type: "string",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "numalign",
      type: "list",
      values: ["left", "center", "right"],
      service: this,
      defaultValue: "center",
      propertyType: PropertyType.propertyAndAttribute
    },
  ];

  public override name = "mathml"

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.full;
  }

  override isHandledElement(designItem: IDesignItem): boolean {
    return designItem.element instanceof designItem.window.MathMLElement;
  }

  override async getProperty(designItem: IDesignItem, name: string): Promise<IProperty> {
    return (<IProperty[]>await this.getProperties(designItem)).find(x => x.name == name);
  }

  override async getProperties(designItem: IDesignItem): Promise<IProperty[] | IPropertyGroup[]> {
    if (!this.isHandledElement(designItem))
      return null;

    switch (designItem.element.localName) {
      case 'math':
        return [...this.commonMathProperties, ...this.mathProperties];
      case 'merror':
        return [...this.commonMathProperties];
      case 'mfrac':
        return [...this.commonMathProperties, ...this.mfracProperties];
      default:
        return [...this.commonMathProperties];
    }
  }
}
