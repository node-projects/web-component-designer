import { IEditorTypesService } from "./IEditorTypesService";
import { IProperty } from './IProperty';
import { IPropertyEditor } from "./IPropertyEditor";
import { ColorPropertyEditor } from './propertyEditors/ColorPropertyEditor';
import { DatePropertyEditor } from './propertyEditors/DatePropertyEditor';
import { JsonPropertyEditor } from "./propertyEditors/JsonPropertyEditor";
import { NumberPropertyEditor } from "./propertyEditors/NumberPropertyEditor";
import { SelectPropertyEditor } from "./propertyEditors/SelectPropertyEditor";
import { TextPropertyEditor } from './propertyEditors/TextPropertyEditor';

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
      case "css-length":
      case "thickness":
      case "string":
      default:
        {
          return new TextPropertyEditor(property);
        }
    }
  }
}