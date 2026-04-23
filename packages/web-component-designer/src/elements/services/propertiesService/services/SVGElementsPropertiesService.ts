import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { CommonPropertiesService } from './CommonPropertiesService.js';
import { PropertyType } from '../PropertyType.js';
import { IPropertyGroup } from '../IPropertyGroup.js';
import { RefreshMode } from '../IPropertiesService.js';

export class SVGElementsPropertiesService extends CommonPropertiesService {

  private rectProperties: IProperty[] = [
    {
      name: "x",
      type: "svg-length",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.attribute
    },
    {
      name: "y",
      type: "svg-length",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.attribute
    },
    {
      name: "width",
      type: "svg-length",
      defaultValue: "auto",
      service: this,
      propertyType: PropertyType.attribute
    },
    {
      name: "height",
      type: "svg-length",
      defaultValue: "auto",
      service: this,
      propertyType: PropertyType.attribute
    },
    {
      name: "rx",
      type: "svg-length",
      defaultValue: "auto",
      service: this,
      propertyType: PropertyType.attribute
    },
    {
      name: "ry",
      type: "svg-length",
      defaultValue: "auto",
      service: this,
      propertyType: PropertyType.attribute
    },
    {
      name: "pathLength",
      type: "svg-length",
      service: this,
      propertyType: PropertyType.attribute
    },
    {
      name: "fill",
      type: "color",
      defaultValue: "transparent",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "fill-opacity",
      type: "number",
      defaultValue: "1",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }
  ];

  private lineProperties: IProperty[] = [
    {
      name: "x1",
      type: "svg-length",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "y1",
      type: "svg-length",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "x2",
      type: "svg-length",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "y2",
      type: "svg-length",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "pathLength",
      type: "svg-length",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }
  ];

  private ellipseProperties: IProperty[] = [
    {
      name: "cx",
      type: "svg-length",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "cy",
      type: "svg-length",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "rx",
      type: "svg-length",
      defaultValue: "auto",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "ry",
      type: "svg-length",
      defaultValue: "auto",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "pathLength",
      type: "svg-length",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "fill",
      type: "color",
      defaultValue: "transparent",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "fill-opacity",
      type: "number",
      defaultValue: "1",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }
  ];

  private pathProperties: IProperty[] = [
    {
      name: "d",
      type: "string",
      defaultValue: '',
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "pathLength",
      type: "svg-length",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }

  ];

  private svgProperties: IProperty[] = [
    {
      name: "width",
      type: "svg-length",
      defaultValue: "auto",
      service: this,
      propertyType: PropertyType.cssValue
    },
    {
      name: "height",
      type: "svg-length",
      defaultValue: "auto",
      service: this,
      propertyType: PropertyType.cssValue
    },
    {
      name: "viewBox",
      type: "string",
      service: this,
      propertyType: PropertyType.cssValue
    }
  ];

  private defaultProperties: IProperty[] = [
    {
      name: "stroke",
      type: "color",
      defaultValue: "currentcolor",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "stroke-width",
      type: "svg-length",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "stroke-opacity",
      type: "number",
      defaultValue: "1",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "visibility",
      type: "list",
      values: ["visible", "hidden"],
      defaultValue: "visible",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }
  ];

  public override name = "svg"

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.fullOnClassChange;
  }

  override isHandledElement(designItem: IDesignItem): boolean {
    switch (designItem.element.localName) {
      case 'rect':
      case 'line':
      case 'ellipse':
      case 'path':
      case 'svg':
        return true;
    }
    return false;
  }

  override async getProperty(designItem: IDesignItem, name: string): Promise<IProperty> {
    return (<IProperty[]>await this.getProperties(designItem)).find(x => x.name == name);
  }

  override async getProperties(designItem: IDesignItem): Promise<IProperty[] | IPropertyGroup[]> {
    if (!this.isHandledElement(designItem))
      return null;
    switch (designItem.element.localName) {

      case 'rect':
        return [...this.rectProperties, ...this.defaultProperties];
      case 'line':
        return [...this.lineProperties, ...this.defaultProperties];
      case 'ellipse':
        return [...this.ellipseProperties, ...this.defaultProperties];
      case 'path':
        return [...this.pathProperties, ...this.defaultProperties];
      case 'svg':
        return this.svgProperties;
    }

    return null;
  }
}
