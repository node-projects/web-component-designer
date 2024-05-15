import { IInstanceService } from './IInstanceService.js';
import { IElementDefinition } from '../elementsService/IElementDefinition.js';
import { IDesignerInstance } from './IDesignerInstance.js';
import type { ServiceContainer } from '../ServiceContainer.js';
import type { InstanceServiceContainer } from '../InstanceServiceContainer.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { DesignItem } from '../../item/DesignItem.js';
import { encodeXMLChars } from '../../helper/XmlHelper.js';
import { newElementFromString } from '../../helper/ElementHelper.js';

export class DefaultInstanceService implements IInstanceService {
  async getElement(definition: IElementDefinition, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<IDesignItem> {
    if (definition.import) {
      let importUri = definition.import;
      if (importUri[0] === '.')
        importUri = (window.location.origin + window.location.pathname).split('/').slice(0, -1).join('/') + '/' + importUri;
      //@ts-ignore
      if (window.importShim) {
        //@ts-ignore
        importShim(importUri).then((x) => {
          let ctor = customElements.get(definition.tag)
          if (!ctor && definition.className && x[definition.className])
            customElements.define(definition.tag, x[definition.className])
          //TODO: refresh all extensions
        });
      }
      else {
        import(importUri).then((x) => {
          let ctor = customElements.get(definition.tag)
          if (!ctor && definition.className && x[definition.className])
            customElements.define(definition.tag, x[definition.className])
          //TODO: refresh all extensions
        });
      }
      //removed await here, feels better to not wait for the elemnt is loaded, maybe this needs to be configurable
      if (instanceServiceContainer.designContext.imports.indexOf(importUri) <= 0)
        instanceServiceContainer.designContext.imports.push(importUri);
    }

    let attr = '';
    if (definition.defaultAttributes) {
      for (let a in definition.defaultAttributes) {
        let value = definition.defaultAttributes[a];
        try {
          if (typeof value === 'object')
            attr += ' ' + a + '="' + encodeXMLChars(JSON.stringify(definition.defaultAttributes[a])) + '"';
          else
            attr += ' ' + a + '="' + encodeXMLChars(definition.defaultAttributes[a]) + '"';
        } catch (e) {
          console.warn(e);
        }
      }
    }

    const elementString = '<' + definition.tag + attr + '></' + definition.tag + '>';

    const element = <HTMLElement>newElementFromString(elementString, instanceServiceContainer.designerCanvas.rootDesignItem.document);
    (<IDesignerInstance><any>element)._inNodeProjectsDesignerView = true;
    if (definition.defaultWidth)
      element.style.width = definition.defaultWidth;
    if (definition.defaultHeight)
      element.style.height = definition.defaultHeight;
    element.style.position = 'absolute'

    if (definition.defaultStyles) {
      for (let s in definition.defaultStyles)
        element.style[s] = definition.defaultStyles[s];
    }

    if (definition.defaultContent) {
      if (typeof definition.defaultContent === "string") {
        const parser = new instanceServiceContainer.designerCanvas.rootDesignItem.window.DOMParser();
        //@ts-ignore
        const doc = parser.parseFromString(definition.defaultContent, 'text/html', { includeShadowRoots: true });
        element.append(...doc.head.childNodes);
        element.append(...doc.body.childNodes);
      } else {
        element.appendChild(definition.defaultContent);
      }
    }

    let designItem = DesignItem.createDesignItemFromInstance(element, serviceContainer, instanceServiceContainer);
    return designItem;
  }
}