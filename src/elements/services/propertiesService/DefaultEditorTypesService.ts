import { IEditorTypesService } from "./IEditorTypesService";
import { IProperty } from './IProperty';
import { IPropertyEditor } from "./IPropertyEditor";
import { ColorPropertyEditor } from './propertyEditors/ColorPropertyEditor';
import { DatePropertyEditor } from './propertyEditors/DatePropertyEditor';
import { JsonPropertyEditor } from "./propertyEditors/JsonPropertyEditor";
import { NumberPropertyEditor } from "./propertyEditors/NumberPropertyEditor";
import { SelectPropertyEditor } from "./propertyEditors/SelectPropertyEditor";
import { TextPropertyEditor } from './propertyEditors/TextPropertyEditor';
import { BooleanPropertyEditor } from './propertyEditors/BooleanPropertyEditor';
import { ImageButtonListPropertyEditor } from './propertyEditors/ImageButtonListPropertyEditor';
import { ThicknessPropertyEditor } from "./propertyEditors/ThicknessPropertyEditor.js";
import { MetricsPropertyEditor } from "./propertyEditors/MetricsPropertyEditor";

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
      case "metrics":
        {
          return new MetricsPropertyEditor(property);
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