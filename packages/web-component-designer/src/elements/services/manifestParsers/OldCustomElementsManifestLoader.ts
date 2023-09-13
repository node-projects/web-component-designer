import { LazyLoader } from '@node-projects/base-custom-webcomponent';
import { IOldCustomElementsManifest } from './IOldCustomElementsManifest.js';
import { ServiceContainer } from '../ServiceContainer.js';
import { IElementDefinition } from '../elementsService/IElementDefinition.js';
import { PreDefinedElementsService } from '../elementsService/PreDefinedElementsService.js';
import { IJsonPropertyDefinition } from '../propertiesService/services/IJsonPropertyDefinition.js';
import { IJsonPropertyDefinitions } from '../propertiesService/services/IJsonPropertyDefinitions.js';
import { ListPropertiesService } from '../propertiesService/services/ListPropertiesService.js';

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