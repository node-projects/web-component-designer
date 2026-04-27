export interface IEditorTypeService {
   getEditor(type: string, additional: { changedCallback: (newValue: any) => void }): { element: HTMLElement, getValue: () => any, setValue: (value: any) => void }
}