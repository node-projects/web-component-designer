import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { PropertyType } from '../PropertyType.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IPropertyGroup } from '../IPropertyGroup.js';
import { CssPropertiesService } from './CssPropertiesService.js';
import { IStyleDeclaration, IStyleRule } from '../../stylesheetService/IStylesheetService.js';

export class CssCurrentPropertiesService extends CssPropertiesService {

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.fullOnValueChange;
  }

  constructor() {
    super('styles');
  }

  override isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  override getProperty(designItem: IDesignItem, name: string): IProperty {
    return { name: name, type: 'string', service: this, propertyType: PropertyType.cssValue };
  }

  override getProperties(designItem: IDesignItem): IProperty[] | IPropertyGroup[] {
    if (!designItem)
      return [];

    let styles = designItem.getAllStyles();

    let arr = styles.map(x => ({
      name: x.selector ?? '&lt;local&gt;', description: x.stylesheetName ?? '', properties: [
        ...x.declarations.map(y => ({ name: y.name, renamable: true, type: 'string', service: this, propertyType: PropertyType.cssValue, styleRule: x, styleDeclaration: y })),
        { name: '', type: 'addNew', service: this, propertyType: PropertyType.complex, styleRule: x }
      ]
    }));
    return arr;
  }

  override setValue(designItems: IDesignItem[], property: (IProperty & { styleRule: IStyleRule, styleDeclaration: IStyleDeclaration }), value: any) {
    if (property.styleDeclaration) {
      designItems[0].instanceServiceContainer.stylesheetService.updateDeclarationWithDeclaration(property.styleDeclaration, value, false);
    }
    else
      super.setValue(designItems, { ...property, propertyType: PropertyType.cssValue }, value);
  }
}
