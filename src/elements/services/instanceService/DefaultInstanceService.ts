import { IInstanceService } from './IInstanceService';
import { IElementDefinition } from '../elementsService/IElementDefinition';
import { IDesignerInstance } from './IDesignerInstance';
import type { ServiceContainer } from '../ServiceContainer';
import type { InstanceServiceContainer } from '../InstanceServiceContainer';
import { IPropertiesService } from '../propertiesService/IPropertiesService';
import { IDesignItem } from '../../item/IDesignItem';
import { DesignItem } from '../../item/DesignItem';


export class DefaultInstanceService implements IInstanceService {
  async getElement(definition: IElementDefinition, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<IDesignItem> {
    if (definition.import) {
      let importUri = definition.import;
      if (importUri[0] === '.')
        importUri = '../../../../../../../../' + importUri;
      await import(importUri);
    }
    let element = document.createElement(definition.tag);
    if (!definition.doNotSetInNodeProjectsDesignerViewOnInstance)
      (<IDesignerInstance><any>element)._inNodeProjectsDesignerView = true;
    if (definition.defaultWidth)
      element.style.width = definition.defaultWidth; // '60px';
    if (definition.defaultHeight)
      element.style.height = definition.defaultHeight; '20px';
    element.style.position = 'absolute'

    switch (definition.tag) {
      case "div":
        break;
      case "input":
        (<HTMLInputElement>element).type = "text";
    }

    if (definition.defaultAttributes) {
      for (let a in definition.defaultAttributes) {
        let value = definition.defaultAttributes[a];
        if (typeof value === 'object')
          element.setAttribute(a, JSON.stringify(definition.defaultAttributes[a]));
        else
          element.setAttribute(a, definition.defaultAttributes[a]);
      }
    }

    if (definition.defaultStyles) {
      for (let s in definition.defaultStyles)
        element.style[s] = definition.defaultStyles[s];
    }

    if (definition.defaultContent) {
      if (typeof definition.defaultContent === "string") {
        element.innerHTML = definition.defaultContent
      } else {
        element.appendChild(definition.defaultContent);
      }
    }

    let designItem = DesignItem.createDesignItemFromInstance(element, serviceContainer, instanceServiceContainer);

    if (definition.defaultProperties) {
      let propertiesService: IPropertiesService = null;
      if (definition.type) {
        propertiesService = serviceContainer.getLastServiceWhere('propertyService', (x) => x.name == definition.type);
      }
      let properties = propertiesService.getProperties(designItem);
      for (let a in definition.defaultProperties) {
        let value = definition.defaultProperties[a];
        let p = properties.find(x => x.name == a)
        propertiesService.setValue([designItem], p, value);
      }
    }

    return designItem;
  }
}