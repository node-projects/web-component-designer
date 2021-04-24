import { IProperty } from './IProperty';
import { IPropertyEditor } from './IPropertyEditor';

export interface IEditorTypesService {
  getEditorForProperty(type: IProperty): IPropertyEditor;
}