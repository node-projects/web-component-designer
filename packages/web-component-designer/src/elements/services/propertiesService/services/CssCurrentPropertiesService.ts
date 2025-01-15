import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { PropertyType } from '../PropertyType.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IPropertyGroup } from '../IPropertyGroup.js';
import { IStyleDeclaration, IStyleRule } from '../../stylesheetService/IStylesheetService.js';
import { ValueType } from '../ValueType.js';
import { NodeType } from '../../../item/NodeType.js';
import cssProperties from "./CssProperties.json" with { type: 'json' };
import { BindingTarget } from '../../../item/BindingTarget.js';
import { AbstractCssPropertiesService } from './AbstractCssPropertiesService.js';
import { PropertiesHelper } from './PropertiesHelper.js';

const localName = '&lt;local&gt;';

export class CssCurrentPropertiesService extends AbstractCssPropertiesService {

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.fullOnValueChange;
  }

  constructor() {
    super();
    this.name = 'styles';
  }

  override isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  override async getProperty(designItem: IDesignItem, name: string): Promise<IProperty> {
    return { name: name, type: 'string', service: this, propertyType: PropertyType.cssValue };
  }

  override async getProperties(designItem: IDesignItem): Promise<IProperty[] | IPropertyGroup[]> {
    if (!designItem || designItem.nodeType != NodeType.Element)
      return [];

    let styles = designItem.getAllStyles().reverse().sort((a, b) => {
      if (a.specificity == null)
        return -1;
      if (b.specificity == null)
        return 1;
      if (a.specificity.A > b.specificity.A)
        return -1;
      if (a.specificity.A === b.specificity.A && a.specificity.B > b.specificity.B)
        return -1;
      if (a.specificity.A === b.specificity.A && a.specificity.B === b.specificity.B && a.specificity.C > b.specificity.C)
        return -1;
      if (a.specificity.A === b.specificity.A && a.specificity.B === b.specificity.B && a.specificity.C === b.specificity.C)
        return 0;
      return 1;
    });

    let arr = styles.map(x => ({
      name: (x.selector ?? localName) + (x.specificity ? ' (' + x.specificity.A + '-' + x.specificity.B + '-' + x.specificity.C + ')' : ''), description: x.stylesheetName ?? '', properties: [
        ...x.declarations.map(y => {
          const camelName = PropertiesHelper.dashToCamelCase(y.name);
          return {
            name: y.name,
            renamable: true,
            type: cssProperties[camelName]?.type ?? 'string',
            values: cssProperties[camelName]?.values ? [...cssProperties[camelName]?.values, 'initial', 'inherit', 'unset'] : ['initial', 'inherit', 'unset'],
            service: this,
            propertyType: PropertyType.cssValue,
            styleRule: x,
            styleDeclaration: y
          }
        }),
        { name: '', type: 'addNew', service: this, propertyType: PropertyType.complex, styleRule: x }
      ]
    }));
    return arr;
  }

  override async setValue(designItems: IDesignItem[], property: (IProperty & { styleRule: IStyleRule, styleDeclaration: IStyleDeclaration }), value: any) {
    // No selector means local style, styleDeclaration is null means new property
    if (property.styleRule?.selector !== null && property.styleDeclaration) {
      designItems[0].instanceServiceContainer.stylesheetService.updateDeclarationValue(property.styleDeclaration, value, false);
      this._notifyChangedProperty(designItems[0], property, value);
      return;
    }
    if (property.styleRule?.selector !== null && !property.styleDeclaration) {
      designItems[0].instanceServiceContainer.stylesheetService.insertDeclarationIntoRule(property.styleRule, property.name, value, false);
      this._notifyChangedProperty(designItems[0], property, value);
      return;
    }

    for (const d of designItems) {
      // Local style
      d.setStyle(property.name, value);
      //unkown css property names do not trigger the mutation observer of property grid, 
      //fixed by assinging stle again to the attribute
      (<HTMLElement>d.element).setAttribute('style', (<HTMLElement>d.element).getAttribute('style'));
    }
  }

  override clearValue(designItems: IDesignItem[], property: IProperty & { styleRule: IStyleRule, styleDeclaration: IStyleDeclaration }, clearType: 'all' | 'binding' | 'value') {
    if (property.styleRule?.selector !== null && property.styleDeclaration) {
      designItems[0].instanceServiceContainer.stylesheetService.removeDeclarationFromRule(property.styleRule, property.styleDeclaration.name);
      return;
    }
    super.clearValue(designItems, property, clearType);
  }

  override getValue(designItems: IDesignItem[], property: IProperty & { styleRule: IStyleRule, styleDeclaration: IStyleDeclaration }) {
    if (property.styleRule?.selector && property.styleDeclaration)
      return property.styleDeclaration.value
    return super.getValue(designItems, property);
  }

  override getUnsetValue(designItems: IDesignItem[], property: IProperty & { styleRule: IStyleRule, styleDeclaration: IStyleDeclaration }) {
    if (property.styleRule?.selector && property.styleDeclaration)
      return property.styleDeclaration.value
    return super.getUnsetValue(designItems, property);
  }

  override isSet(designItems: IDesignItem[], property: IProperty & { styleRule: IStyleRule, styleDeclaration: IStyleDeclaration }): ValueType {
    if (property.styleRule?.selector && property.styleDeclaration) {
      if (designItems[0].hasStyle(property.name))
        return ValueType.none;
      //TODO: we need to check if this is the dec. with the highest specifity
      return ValueType.fromStylesheet;
    }
    return super.isSet(designItems, property);
  }

  override getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget {
    if (property.name.startsWith('--'))
      return BindingTarget.cssvar;
    return BindingTarget.css;
  }
}
