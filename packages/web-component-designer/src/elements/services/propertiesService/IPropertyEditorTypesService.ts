import { IProperty } from './IProperty.js';
import { IPropertyEditor } from './IPropertyEditor.js';

export interface IPropertyEditorTypesService {
  getEditorForProperty(property: IProperty): IPropertyEditor | null;
}