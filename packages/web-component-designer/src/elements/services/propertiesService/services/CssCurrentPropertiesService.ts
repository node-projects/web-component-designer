import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { PropertyType } from '../PropertyType.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IPropertyGroup } from '../IPropertyGroup.js';
import { IStyleDeclaration, IStyleRule } from '../../stylesheetService/IStylesheetService.js';
import { CommonPropertiesService } from './CommonPropertiesService.js';
import { ValueType } from '../ValueType.js';
import { NodeType } from '../../../item/NodeType.js';

//TODO: remove this code when import asserts are supported
let cssProperties: any;
//@ts-ignore
if (window.importShim) {
  const cssPropertiesUrl = import.meta.resolve('./CssProperties.json')
  //@ts-ignore
  cssProperties = await importShim(cssPropertiesUrl, { assert: { type: 'json' } });
} else
  //@ts-ignore
  cssProperties = await import("./CssProperties.json", { assert: { type: 'json' } });

if (cssProperties.default)
  cssProperties = cssProperties.default;

const localName = '&lt;local&gt;';

export class CssCurrentPropertiesService extends CommonPropertiesService {

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

  override getProperty(designItem: IDesignItem, name: string): IProperty {
    return { name: name, type: 'string', service: this, propertyType: PropertyType.cssValue };
  }

  override getProperties(designItem: IDesignItem): IProperty[] | IPropertyGroup[] {
    if (!designItem || designItem.nodeType != NodeType.Element)
      return [];

    let styles = designItem.getAllStyles();

    let arr = styles.map(x => ({
      name: x.selector ?? localName, description: x.stylesheetName ?? '', properties: [
        ...x.declarations.map(y => ({
          name: y.name,
          renamable: true,
          type: cssProperties[y.name]?.type ?? 'string',
          values: cssProperties[y.name]?.values ? [...cssProperties[y.name]?.values, 'initial', 'inherit', 'unset'] : ['initial', 'inherit', 'unset'],
          service: this,
          propertyType: PropertyType.cssValue,
          styleRule: x,
          styleDeclaration: y
        })),
        { name: '', type: 'addNew', service: this, propertyType: PropertyType.complex, styleRule: x }
      ]
    }));
    return arr;
  }

  override setValue(designItems: IDesignItem[], property: (IProperty & { styleRule: IStyleRule, styleDeclaration: IStyleDeclaration }), value: any) {
    // No selector means local style, styleDeclaration is null means new property
    if (property.styleRule?.selector !== null && property.styleDeclaration) {
      // styleDeclaration stored Propertygrid is not refreshed after entering a new value, so we need to reload
      // TODO: we do not respect if a same style is found in a media query or another @rule, maybe we need a refresh in the stylesheet parser
      const decls = designItems[0].instanceServiceContainer.stylesheetService?.getDeclarations(designItems[0], property.styleDeclaration.name);
      const currentDecl = decls.find(x => x.parent.selector == property.styleDeclaration.parent.selector && x.parent.stylesheetName == property.styleDeclaration.parent.stylesheetName);

      designItems[0].instanceServiceContainer.stylesheetService.updateDeclarationValue(currentDecl, value, false);
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
      return ValueType.all;
    }
    return super.isSet(designItems, property);
  }
}
