import { IProperty } from './IProperty';

export interface IEditorTypesService {
    getEditorForProperty(type: IProperty): HTMLElement;
}