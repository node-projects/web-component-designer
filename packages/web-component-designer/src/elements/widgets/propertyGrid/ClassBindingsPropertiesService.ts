import { BindingTarget } from '../../item/BindingTarget.js';
import { IBinding } from '../../item/IBinding.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { RefreshMode } from '../../services/propertiesService/IPropertiesService.js';
import { IProperty } from '../../services/propertiesService/IProperty.js';
import { PropertyType } from '../../services/propertiesService/PropertyType.js';
import { ValueType } from '../../services/propertiesService/ValueType.js';
import { AbstractPropertiesService } from '../../services/propertiesService/services/AbstractPropertiesService.js';

/** Adapter for host binding editors: a class token is a boolean binding target. */
export class ClassBindingsPropertiesService extends AbstractPropertiesService {
  getRefreshMode() { return RefreshMode.fullOnValueChange; }
  isHandledElement(designItem: IDesignItem) { return !designItem.isRootItem; }

  getBindings(designItem: IDesignItem): IBinding[] {
    return designItem.serviceContainer.getServices('bindingService')
      .flatMap(service => (service.getBindings(designItem) ?? [])
        .filter(binding => binding.target === BindingTarget.class)
        .map(binding => ({ ...binding, service })));
  }

  async getProperties(designItem: IDesignItem): Promise<IProperty[]> {
    return this.getBindings(designItem).map(binding => this.createProperty(binding.targetName));
  }

  override async getProperty(designItem: IDesignItem, name: string) {
    return this.createProperty(name);
  }

  createProperty(name: string): IProperty {
    return { name, type: 'boolean', propertyType: PropertyType.property, service: this };
  }

  override getPropertyTarget() { return BindingTarget.class; }
  override getBinding(items: IDesignItem[], property: IProperty) {
    return this.getBindings(items[0]).find(binding => binding.targetName === property.name);
  }
  override isSet(items: IDesignItem[], property: IProperty) {
    return this.getBinding(items, property) ? ValueType.bound : ValueType.none;
  }
  override getValue(items: IDesignItem[], property: IProperty) {
    return this.getBinding(items, property)?.expression;
  }

  validateName(designItem: IDesignItem, name: string, previousName?: string): string {
    if (!name || /[\s"'<>/=]/.test(name) || name !== name.toLowerCase())
      return 'Use a lowercase class name without spaces or HTML attribute delimiters, e.g. is-active.';
    if (name !== previousName && this.getBindings(designItem).some(binding => binding.targetName === name))
      return 'This class already has a binding.';
    return null;
  }

  rename(designItem: IDesignItem, binding: IBinding, name: string) {
    const error = this.validateName(designItem, name, binding.targetName);
    if (error)
      throw new Error(error);
    if (name === binding.targetName)
      return;
    const group = designItem.openGroup(`rename class binding: ${binding.targetName} to ${name}`);
    try {
      if (!binding.service.setBinding(designItem, { ...binding, targetName: name }))
        throw new Error('The binding service could not rename this binding.');
      if (!binding.service.clearBinding(designItem, binding.targetName, BindingTarget.class))
        throw new Error('The binding service could not remove the previous binding.');
      group.commit();
    } catch (error) {
      group.abort();
      throw error;
    }
  }

  remove(designItem: IDesignItem, binding: IBinding) {
    const group = designItem.openGroup(`remove class binding: ${binding.targetName}`);
    try {
      if (!binding.service.clearBinding(designItem, binding.targetName, BindingTarget.class))
        throw new Error('The binding service could not remove this binding.');
      group.commit();
    } catch (error) {
      group.abort();
      throw error;
    }
  }
}
