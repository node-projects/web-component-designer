import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { CommonPropertiesService } from './CommonPropertiesService.js';
import { PropertyType } from '../PropertyType.js';
import { IPropertyGroup } from '../IPropertyGroup.js';

export class SVGElementsPropertiesService extends CommonPropertiesService {

  private rectProperties: IProperty[] = [
    {
      name: "x",
      type: "number",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "y",
      type: "number",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "width",
      type: "number",
      defaultValue: "auto",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "height",
      type: "number",
      defaultValue: "auto",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "rx",
      type: "number",
      defaultValue: "auto",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "ry",
      type: "number",
      defaultValue: "auto",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "pathLength",
      type: "number",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "fill",
      type: "list",
      values: ["transparent", "black", "white", "blue", "green", "red", "yellow", "orange", "brown", "grey"],
      defaultValue: "transparent",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "fill-opacity",
      type: "list",
      values: ["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1"],
      defaultValue: "1",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }
  ];

  private lineProperties: IProperty[] = [
    {
      name: "x1",
      type: "number",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "y1",
      type: "number",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "x2",
      type: "number",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "y2",
      type: "number",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "pathLength",
      type: "number",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }
  ];

  private ellipseProperties: IProperty[] = [
    {
      name: "cx",
      type: "number",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "cy",
      type: "number",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "rx",
      type: "number",
      defaultValue: "auto",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "ry",
      type: "number",
      defaultValue: "auto",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "pathLength",
      type: "number",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "fill",
      type: "list",
      values: ["transparent", "black", "white", "blue", "green", "red", "yellow", "orange", "brown", "grey"],
      defaultValue: "transparent",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "fill-opacity",
      type: "list",
      values: ["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1"],
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
      type: "number",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }

  ];

  private svgProperties: IProperty[] = [
    {
      name: "width",
      type: "number",
      defaultValue: "auto",
      service: this,
      propertyType: PropertyType.cssValue
    },
    {
      name: "height",
      type: "number",
      defaultValue: "auto",
      service: this,
      propertyType: PropertyType.cssValue
    },
    {
      name: "viewBox",
      type: "number",
      service: this,
      propertyType: PropertyType.cssValue
    }
  ];


  private defaultProperties: IProperty[] = [
    {
      name: "stroke",
      type: "list",
      values: ["black", "white", "blue", "green", "red", "yellow", "orange", "brown", "grey"],
      defaultValue: "currentcolor",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "stroke-width",
      type: "number",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "stroke-opacity",
      type: "list",
      values: ["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1"],
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
