import { IDesignItem } from '../../item/IDesignItem';
import { IDeserializationOptions } from './IDeserializationOptions';
import { DesignItem } from '../../item/DesignItem';
import type { ServiceContainer } from '../ServiceContainer';
import type { InstanceServiceContainer } from '../InstanceServiceContainer';

export class HtmlDeserializationService {
  deserialize(code : string, options: IDeserializationOptions) : IDesignItem {
    //HtmlDeserializationService._createDesignItemsRecursive
    return null;
  }

  private static _createDesignItemsRecursive(node: Node, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer) {
    DesignItem.GetOrCreateDesignItem(node, serviceContainer, instanceServiceContainer);
    for (let e of node.childNodes) {
      HtmlDeserializationService._createDesignItemsRecursive(e, serviceContainer, instanceServiceContainer);
    }
  }
}