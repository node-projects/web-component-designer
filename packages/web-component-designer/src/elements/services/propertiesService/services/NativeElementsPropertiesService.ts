import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { PropertyType } from '../PropertyType.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IPropertyGroup } from '../IPropertyGroup.js';
import { AbstractPropertiesService } from './AbstractPropertiesService.js';

export class NativeElementsPropertiesService extends AbstractPropertiesService {

  private inputProperties: IProperty[] = [
    {
      name: "type",
      type: "list",
      values: ["text", "number", "button", "checkbox", "color", "date", "datetime-local", "email", "file", "hidden", "image", "month", "password", "radio", "range", "reset", "search", "submit", "tel", "time", "url", "week"],
      service: this,
      defaultValue: "text",
      propertyType: PropertyType.propertyAndAttribute
    }, {
      name: "value",
      type: "string",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }, {
      name: "placeholder",
      type: "string",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }, {
      name: "checked",
      type: "boolean",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }, {
      name: "min",
      type: "number",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }, {
      name: "max",
      type: "number",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }, {
      name: "readonly",
      type: "boolean",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }, {
      name: "valueAsDate",
      type: "string",
      service: this,
      propertyType: PropertyType.property
    },
    {
      name: "valueAsNumber",
      type: "string",
      service: this,
      propertyType: PropertyType.property
    }
  ];

  private textareaProperties: IProperty[] = [
    {
      name: "value",
      type: "string",
      service: this,
      propertyType: PropertyType.property
    },
    {
      name: "placeholder",
      type: "string",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }, {
      name: "maxlength",
      type: "number",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }, {
      name: "cols",
      type: "number",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }, {
      name: "rows",
      type: "number",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }, {
      name: "readonly",
      type: "boolean",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }, {
      name: "resize",
      type: "list",
      values: ["both", "none", "horizontal", "vertical"],
      service: this,
      propertyType: PropertyType.cssValue
    }
  ];

  private selectProperties: IProperty[] = [
    {
      name: "value",
      type: "string",
      service: this,
      propertyType: PropertyType.property
    },
    {
      name: "size",
      type: "number",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }, {
      name: "multiple",
      type: "boolean",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }
  ];

  private buttonProperties: IProperty[] = [
    {
      name: "type",
      type: "list",
      values: ["button", "submit", "reset"],
      service: this,
      defaultValue: "button",
      propertyType: PropertyType.propertyAndAttribute
    }, {
      name: "value",
      type: "string",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }
  ];

  private anchorProperties: IProperty[] = [
    {
      name: "href",
      type: "string",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }
  ];

  private divProperties: IProperty[] = [
    {
      name: "title",
      type: "string",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }
  ];

  private imgProperties: IProperty[] = [
    {
      name: "src",
      type: "string",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "alt",
      type: "string",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }
  ];

  private iframeProperties: IProperty[] = [
    {
      name: "src",
      type: "string",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }
  ];

  private formElementProperties: IProperty[] = [
    {
      name: "autofocus",
      type: "boolean",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "disabled",
      type: "boolean",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    },
    {
      name: "required",
      type: "boolean",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    }
  ];

  public name = "native"

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.full;
  }

  override isHandledElement(designItem: IDesignItem): boolean {
    switch (designItem.element.localName) {
      case 'input':
      case 'textarea':
      case 'select':
      case 'button':
      case 'a':
      case 'div':
      case 'span':
      case 'br':
      case 'img':
      case 'iframe':
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
      case 'p':
        return true;
    }
    return false;
  }

  override getProperty(designItem: IDesignItem, name: string): IProperty {
    return (<IProperty[]>this.getProperties(designItem)).find(x => x.name == name);
  }

  override getProperties(designItem: IDesignItem): IProperty[] | IPropertyGroup[] {
    if (!this.isHandledElement(designItem))
      return null;
    switch (designItem.element.localName) {
      case 'input':
        return [...this.inputProperties, ...this.formElementProperties];
      case 'textarea':
        return [...this.textareaProperties, ...this.formElementProperties];
      case 'select':
        return [...this.selectProperties, ...this.formElementProperties];
      case 'button':
        return [...this.buttonProperties, ...this.formElementProperties];
      case 'a':
        return this.anchorProperties;
      case 'div':
        return this.divProperties;
      case 'img':
        return this.imgProperties;
      case 'iframe':
        return this.iframeProperties;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
      case 'p':
        return [];
    }

    return null;
  }
}
