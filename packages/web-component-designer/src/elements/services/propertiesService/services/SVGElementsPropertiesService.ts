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
      propertyType: PropertyType.attribute
    },
    {
      name: "fill-opacity",
      type: "number",
      defaultValue: "1",
      service: this,
      propertyType: PropertyType.attribute
    }
  ];

  private lineProperties: IProperty[] = [
    {
      name: "x1",
      type: "svg-length",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.attribute
    },
    {
      name: "y1",
      type: "svg-length",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.attribute
    },
    {
      name: "x2",
      type: "svg-length",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.attribute
    },
    {
      name: "y2",
      type: "svg-length",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.attribute
    },
    {
      name: "pathLength",
      type: "svg-length",
      service: this,
      propertyType: PropertyType.attribute
    }
  ];

  private ellipseProperties: IProperty[] = [
    {
      name: "cx",
      type: "svg-length",
      defaultValue: "0",
      service: this,
      propertyType: PropertyType.attribute
    },
    {
      name: "cy",
      type: "svg-length",
      defaultValue: "0",
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
      propertyType: PropertyType.attribute
    },
    {
      name: "fill-opacity",
      type: "number",
      defaultValue: "1",
      service: this,
      propertyType: PropertyType.attribute
    }
  ];

  private pathProperties: IProperty[] = [
    {
      name: "d",
      type: "string",
      defaultValue: '',
      service: this,
      propertyType: PropertyType.attribute
    },
    {
      name: "pathLength",
      type: "svg-length",
      service: this,
      propertyType: PropertyType.attribute
    }

  ];

  private svgProperties: IProperty[] = [
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
      name: "viewBox",
      type: "string",
      service: this,
      propertyType: PropertyType.attribute
    }
  ];

  private defaultProperties: IProperty[] = [
    {
      name: "stroke",
      type: "color",
      defaultValue: "currentcolor",
      service: this,
      propertyType: PropertyType.attribute
    },
    {
      name: "stroke-width",
      type: "svg-length",
      service: this,
      propertyType: PropertyType.attribute
    },
    {
      name: "stroke-opacity",
      type: "number",
      defaultValue: "1",
      service: this,
      propertyType: PropertyType.attribute
    },
    {
      name: "visibility",
      type: "list",
      values: ["visible", "hidden"],
      defaultValue: "visible",
      service: this,
      propertyType: PropertyType.attribute
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
    let props: IProperty[] = null;
    if (!this.isHandledElement(designItem))
      return null;
    switch (designItem.element.localName) {
      case 'rect':
        props = [...this.rectProperties, ...this.defaultProperties];
        break;
      case 'line':
        props = [...this.lineProperties, ...this.defaultProperties];
        break;
      case 'ellipse':
        props = [...this.ellipseProperties, ...this.defaultProperties];
        break;
      case 'path':
        props = [...this.pathProperties, ...this.defaultProperties];
        break;
      case 'svg':
        props = this.svgProperties;
        break;
    }

    if (designItem.element.localName == 'line' || designItem.element.localName == 'path') {
      const markers = this.getAllMarkerIds(designItem);
      if (markers.length > 0 || designItem.hasAttribute('marker-start')) {
        props.push({ name: "marker-start", type: "string", values: markers, service: this, propertyType: PropertyType.attribute });
      }
      if (markers.length > 0 || designItem.hasAttribute('marker-mid')) {
        props.push({ name: "marker-mid", type: "string", values: markers, service: this, propertyType: PropertyType.attribute });
      }
      if (markers.length > 0 || designItem.hasAttribute('marker-end')) {
        props.push({ name: "marker-end", type: "string", values: markers, service: this, propertyType: PropertyType.attribute });
      }
    }

    return props;
  }

  private getAllMarkerIds(designItem: IDesignItem): string[] {
    const svgElement = designItem.element as SVGElement;
    const svg = svgElement.ownerSVGElement;
    const markerElements = svg.querySelectorAll<SVGMarkerElement>('defs > marker');
    return [...markerElements].map(m => `url(#${m.id})`).filter(id => !!id);
  }
}
