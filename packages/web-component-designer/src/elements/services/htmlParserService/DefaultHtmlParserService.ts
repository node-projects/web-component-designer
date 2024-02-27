import { InstanceServiceContainer } from '../InstanceServiceContainer.js';
import { ServiceContainer } from '../ServiceContainer.js';
import { IHtmlParserService } from './IHtmlParserService.js';
import { DesignItem } from '../../item/DesignItem.js';
import { IDesignItem } from '../../item/IDesignItem.js';

export class DefaultHtmlParserService implements IHtmlParserService {
  async parse(html: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer, parseSnippet: boolean): Promise<IDesignItem[]> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return this.createDesignItems(doc.body.childNodes, serviceContainer, instanceServiceContainer);
  }

  public createDesignItems(elements: NodeListOf<ChildNode> | Node[] | HTMLCollection | HTMLElement[], serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer) {
    let res: IDesignItem[] = [];
    for (let el of elements) {
      res.push(this._createDesignItemsRecursive(el, serviceContainer, instanceServiceContainer));
    }
    return res;
  }

  private _createDesignItemsRecursive(node: Node, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer) {
    return DesignItem.createDesignItemFromInstance(node, serviceContainer, instanceServiceContainer);
  }
}