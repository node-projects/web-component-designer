import { ServiceContainer } from '../services/ServiceContainer';
import { LazyLoader } from '@node-projects/base-custom-webcomponent';
import { IOldCustomElementsManifest } from './IOldCustomElementsManifest';
import { IElementDefinition } from '../services/elementsService/IElementDefinition';
import { PreDefinedElementsService } from '../services/elementsService/PreDefinedElementsService';
import { ListPropertiesService } from '../services/propertiesService/services/ListPropertiesService';
import { IJsonPropertyDefinitions } from '../services/propertiesService/services/IJsonPropertyDefinitions';
import { IJsonPropertyDefinition } from '../services/propertiesService/services/IJsonPropertyDefinition';

export class OldCustomElementsManifestLoader {
  public static async loadManifest(serviceContainer: ServiceContainer, nodeModule: string, options?: { name?: string, dontLoadWidgets?: boolean, dontLoadProperties?: boolean }) {
    const nodePath = './node_modules/';
    const packageJson = JSON.parse(await LazyLoader.LoadText(nodePath + nodeModule + '/package.json'));
    let jsModule = nodePath + nodeModule + '/' + packageJson.main;
    if (packageJson.module)
      jsModule = nodePath + nodeModule + '/' + packageJson.module;
    const manifest = <IOldCustomElementsManifest>JSON.parse(await LazyLoader.LoadText(nodePath + nodeModule + '/' + packageJson.customElementsManifest));
    let name = nodeModule;
    if (options && options.name)
      name = options.name;

    if (!options || !options.dontLoadWidgets) {
      const elementDefinitions: IElementDefinition[] = [];
      for (const tag of manifest.tags) {
        const elementDefinition: IElementDefinition = { tag: tag.name, import: jsModule, description: tag.description }
        elementDefinitions.push(elementDefinition);
      }
      const service = new PreDefinedElementsService(name, { elements: elementDefinitions });
      serviceContainer.register('elementsService', service);
    }

    if (!options || !options.dontLoadProperties) {
      const propertyDefinitions: IJsonPropertyDefinitions = {};
      for (const tag of manifest.tags) {
        const attributes: IJsonPropertyDefinition[] = []
        for (const attr of tag.attributes) {
          let propertyDefinition: IJsonPropertyDefinition = { name: attr.name, default: attr.default, description: attr.description }
          if (attr.type && attr.type.startsWith('"')) {
            propertyDefinition.type = 'list';
            propertyDefinition.values = attr.type.split('|');
          } else {
            propertyDefinition.type = attr.type;
          }
          attributes.push(propertyDefinition);
        }
        propertyDefinitions[tag.name] = attributes;
      }
      const service = new ListPropertiesService(propertyDefinitions);
      serviceContainer.register('propertyService', service);
    }

  }
}