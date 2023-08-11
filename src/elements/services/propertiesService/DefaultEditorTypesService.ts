import { IEditorTypesService } from './IEditorTypesService.js';
import { IProperty } from './IProperty.js';
import { IPropertyEditor } from './IPropertyEditor.js';
import { ColorPropertyEditor } from './propertyEditors/ColorPropertyEditor.js';
import { DatePropertyEditor } from './propertyEditors/DatePropertyEditor.js';
import { JsonPropertyEditor } from './propertyEditors/JsonPropertyEditor.js';
import { NumberPropertyEditor } from './propertyEditors/NumberPropertyEditor.js';
import { SelectPropertyEditor } from './propertyEditors/SelectPropertyEditor.js';
import { TextPropertyEditor } from './propertyEditors/TextPropertyEditor.js';
import { BooleanPropertyEditor } from './propertyEditors/BooleanPropertyEditor.js';
import { ImageButtonListPropertyEditor } from './propertyEditors/ImageButtonListPropertyEditor.js';
import { ThicknessPropertyEditor } from "./propertyEditors/ThicknessPropertyEditor.js";

export class DefaultEditorTypesService implements IEditorTypesService {
  getEditorForProperty(property: IProperty): IPropertyEditor {
    if (property.createEditor)
      return property.createEditor(property);

    switch (<string><any>property.type) {
      case "json":
        {
          return new JsonPropertyEditor(property);
        }
      case "color":
        {
          return new ColorPropertyEditor(property);
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
      case "css-length":
      case "string":
      default:
        {
          return new TextPropertyEditor(property);
        }
    }
  }
}