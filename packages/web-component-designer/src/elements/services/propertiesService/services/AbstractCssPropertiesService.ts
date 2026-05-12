import { IDesignItem } from '../../../item/IDesignItem.js';
import { CommonPropertiesService } from './CommonPropertiesService.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IProperty } from '../IProperty.js';
import { PropertiesHelper } from './PropertiesHelper.js';
import { applyCssNumericPropertyDefaults } from '../propertyEditors/UnitPropertyEditorConfig.js';
import { splitCssImportant } from '../../../helper/CssImportant.js';

export abstract class AbstractCssPropertiesService extends CommonPropertiesService {

  protected _enrichCssProperty(property: IProperty): IProperty {
    return applyCssNumericPropertyDefaults(property);
  }

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.none;
  }

  async previewValue?(designItems: IDesignItem[], property: IProperty, value: any): Promise<void> {
    let nm = property.propertyName ?? property.name;
    if (!nm.startsWith('--'))
      nm = PropertiesHelper.camelToDashCase(nm);
    const parsedValue = typeof value === 'string' ? splitCssImportant(value) : { value, important: false };
    for (let d of designItems) {
      (<HTMLElement>d.element).style.setProperty(nm, parsedValue.value, parsedValue.important ? 'important' : '');
    }
  }

  async removePreviewValue?(designItems: IDesignItem[], property: IProperty): Promise<void> {
    let nm = property.propertyName ?? property.name;
    if (!nm.startsWith('--'))
      nm = PropertiesHelper.camelToDashCase(nm);
    for (let d of designItems) {
      if (d.hasStyle(nm))
        (<HTMLElement>d.element).style.setProperty(nm, d.getStyle(nm), d.isStyleImportant(nm) ? 'important' : '');
      else
        (<HTMLElement>d.element).style.setProperty(nm, '');
    }
  }

  constructor() {
    super(false);
  }
}
