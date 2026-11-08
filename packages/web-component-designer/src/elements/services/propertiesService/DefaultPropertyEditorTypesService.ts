import { IPropertyEditorTypesService } from './IPropertyEditorTypesService.js';
import { IProperty } from './IProperty.js';
import { IPropertyEditor } from './IPropertyEditor.js';
import { ColorPropertyEditor } from './propertyEditors/ColorPropertyEditor.js';
import { DatePropertyEditor } from './propertyEditors/DatePropertyEditor.js';
import { JsonPropertyEditor } from './propertyEditors/JsonPropertyEditor.js';
import { NumberPropertyEditor } from './propertyEditors/NumberPropertyEditor.js';
import { SelectPropertyEditor } from './propertyEditors/SelectPropertyEditor.js';
import { TextPropertyEditor } from './propertyEditors/TextPropertyEditor.js';
import { SuggestedPropertyEditor } from './propertyEditors/SuggestedPropertyEditor.js';
import { BooleanPropertyEditor } from './propertyEditors/BooleanPropertyEditor.js';
import { ImageButtonListPropertyEditor } from './propertyEditors/ImageButtonListPropertyEditor.js';
import { ThicknessPropertyEditor } from "./propertyEditors/ThicknessPropertyEditor.js";
import { FontPropertyEditor } from './propertyEditors/FontPropertyEditor.js';
import { UnitPropertyEditor } from './propertyEditors/UnitPropertyEditor.js';
import { isUnitPropertyType } from './propertyEditors/UnitPropertyEditorConfig.js';
import { PropertyType } from './PropertyType.js';
import { CssPropertyEditor } from './propertyEditors/CssPropertyEditor.js';

export class DefaultPropertyEditorTypesService implements IPropertyEditorTypesService {
  getEditorForProperty(property: IProperty): IPropertyEditor {
    if (property.propertyType === PropertyType.cssValue)
      return new CssPropertyEditor(property, p => this._getEditorForProperty(p));

    return this._getEditorForProperty(property);
  }

  private _getEditorForProperty(property: IProperty): IPropertyEditor {
    if (property.createEditor)
      return property.createEditor(property);

    if (isUnitPropertyType(property.type, property.name))
      return new UnitPropertyEditor(property);

    switch (<string><any>property.type) {
      case "json":
        {
          return new JsonPropertyEditor(property);
        }
      case "css-color":
      case "color":
        {
          return new ColorPropertyEditor(property);
        }
      case "css-font":
      case "font":
        {
          return new FontPropertyEditor(property);
        }
      case "date":
        {
          return new DatePropertyEditor(property);
        }
      case "number":
        {
          return new NumberPropertyEditor(property);
        }
      case "list":
        {
          return new SelectPropertyEditor(property);
        }
      case "enum":
        {
          return new SelectPropertyEditor(property);
        }
      case "boolean":
        {
          return new BooleanPropertyEditor(property);
        }
      case "img-list":
        {
          return new ImageButtonListPropertyEditor(property);
        }
      case "thickness":
        {
          return new ThicknessPropertyEditor(property);
        }
      case "string":
      case "css-string":
      case "css-position":
      // CSS keywords are suggestions: var(), expressions and future values stay editable.
      case "css-list":
      default:
        {
          return property.values?.length ? new SuggestedPropertyEditor(property) : new TextPropertyEditor(property);
        }
    }
  }
}
