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
        importUri = (window.location.origin + window.location.pathname).split('/').slice(0, -1).join('/') + '/' + importUri;
      import(importUri).then(() => {
        //TODO: refresh all extensions
      }); //removed await here, feels better to not wait for the elemnt is loaded, maybe this needs to be configurable
      if (instanceServiceContainer.designContext.imports.indexOf(importUri) <= 0)
        instanceServiceContainer.designContext.imports.push(importUri);
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