import { PropertyType } from '@node-projects/web-component-designer/dist/elements/services/propertiesService/PropertyType.js';
import type { IProperty, IPropertyGridExtensionProvider, IPropertyGridExtension } from '@node-projects/web-component-designer';
import { PropertyGridClassBindings } from './PropertyGridClassBindings.js';

/** Register in serviceContainer.propertyGridExtensions to enable visualization class bindings. */
export class ClassBindingsPropertyGridExtensionProvider implements IPropertyGridExtensionProvider {
  createExtension(property: IProperty): IPropertyGridExtension | undefined {
    if ((property.name !== 'class' && property.name !== 'className') || property.propertyType === PropertyType.cssValue)
      return undefined;
    const element = new PropertyGridClassBindings();
    return {
      element,
      refresh: items => element.refresh(items),
      getContextMenuItems: items => [{ title: 'Add class binding…', disabled: items?.length !== 1 || !items[0].serviceContainer.config.openBindingsEditor, action: () => element.addBinding() }]
    };
  }
}
