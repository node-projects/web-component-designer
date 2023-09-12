import { IProperty } from './IProperty.js';
import { IPropertyEditor } from './IPropertyEditor.js';

export interface IEditorTypesService {
  getEditorForProperty(type: IProperty): IPropertyEditor;
}