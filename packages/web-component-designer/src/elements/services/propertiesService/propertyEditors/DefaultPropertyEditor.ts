import { IProperty } from '../IProperty.js';
import { BasePropertyEditor } from './BasePropertyEditor.js';
import { ValueType } from '../ValueType.js';
import { ServiceContainer } from '../../ServiceContainer.js';
import { IEditorTypeService } from '../IEditorTypeService.js';

export class TextPropertyEditor extends BasePropertyEditor<HTMLElement> {

  editor: ReturnType<IEditorTypeService['getEditor']>;

  constructor(property: IProperty, serviceContainer: ServiceContainer) {
    super(property);

    const editor = serviceContainer.forSomeServicesTillResult('editorTypeService',
      x => x.getEditor(property.type, {
        changedCallback: (newValue) => this._valueChanged(newValue)
      }));
    this.editor = editor;
    this.element = editor.element;
  }

  refreshValue(valueType: ValueType, value: any) {
    this.editor.setValue(value);
  }
}