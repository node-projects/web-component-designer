import { IDesignItem } from "../../..";
import { InstanceServiceContainer } from "../InstanceServiceContainer";
import { ServiceContainer } from "../ServiceContainer";
import { IHtmlParserService } from "./IHtmlParserService";
import { DesignItem } from '../../item/DesignItem';

export class DefaultHtmlParserService implements IHtmlParserService {
  async parse(html: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<IDesignItem[]> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return this.createDesignItems(doc.body.children, serviceContainer, instanceServiceContainer);
  }

  public createDesignItems(elements: HTMLCollection | HTMLElement[], serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer) {
    let res: IDesignItem[] = [];
    for (let el of elements) {
      res.push(this._createDesignItemsRecursive(el, serviceContainer, instanceServiceContainer))
    }
    return res;
  }

  private _createDesignItemsRecursive(element: Element, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer) {
    return DesignItem.createDesignItemFromInstance(element, serviceContainer, instanceServiceContainer);
  }
}