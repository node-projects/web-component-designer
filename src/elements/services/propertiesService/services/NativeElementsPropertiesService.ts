import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { CommonPropertiesService } from "./CommonPropertiesService";

export class NativeElementsPropertiesService extends CommonPropertiesService {

  //@ts-ignore
  private inputProperties: IProperty[] = [
    {
      name: "type",
      type: "list",
      values: ["text", "number", "button", "checkbox", "color", "date", "datetime-local", "email", "file", "hidden", "image", "month", "password", "radio", "range", "reset", "search", "submit", "tel", "time", "url", "week"],
      service: this,
      defaultValue: "text"
    }, {
      name: "value",
      type: "string",
      service: this
    }, {
      name: "checked",
      type: "boolean",
      service: this
    }, {
      name: "min",
      type: "number",
      service: this
    }, {
      name: "max",
      type: "number",
      service: this
    }
  ];

  private buttonProperties: IProperty[] = [
    {
      name: "type",
      type: "list",
      values: ["button", "submit", "reset"],
      service: this,
      defaultValue: "button"
    }, {
      name: "value",
      type: "string",
      service: this
    }, {
      name: "disabled",
      type: "boolean",
      service: this
    }
  ];

  private anchorProperties: IProperty[] = [
    {
      name: "href",
      type: "string",
      service: this
    }
  ];

  private divProperties: IProperty[] = [
    {
      name: "title",
      type: "string",
      service: this
    }
  ];

  private imgProperties: IProperty[] = [
    {
      name: "src",
      type: "string",
      service: this
    }
  ];

  private iframeProperties: IProperty[] = [
    {
      name: "src",
      type: "string",
      service: this
    }
  ];

  public override name = "native"

  override isHandledElement(designItem: IDesignItem): boolean {
    switch (designItem.element.localName) {
      case 'input':
      case 'button':
      case 'a':
      case 'div':
      case 'span':
      case 'br':
      case 'img':
      case 'iframe':
        return true;
    }
    return false;
  }

  override getProperty(designItem: IDesignItem, name: string): IProperty {
    return this.getProperties(designItem)[name];
  }

  override getProperties(designItem: IDesignItem): IProperty[] {
    if (!this.isHandledElement(designItem))
      return null;
    switch (designItem.element.localName) {
      case 'input':
        return this.inputProperties;
      case 'button':
        return this.buttonProperties;
      case 'a':
        return this.anchorProperties;
      case 'div':
        return this.divProperties;
      case 'img':
        return this.imgProperties;
      case 'iframe':
        return this.iframeProperties;
    }

    return null;
  }
}
