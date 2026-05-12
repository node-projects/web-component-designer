import { expect, test } from '@jest/globals';
import { CssAttributeParser } from '../src/elements/helper/CssAttributeParser';
import { appendCssImportant, splitCssImportant } from '../src/elements/helper/CssImportant';
import { CssPropertyEditor } from '../src/elements/services/propertiesService/propertyEditors/CssPropertyEditor';
import { CssStyleChangeAction } from '../src/elements/services/undoService/transactionItems/CssStyleChangeAction';
import { IDesignItem } from '../src/elements/item/IDesignItem';
import { PropertyType } from '../src/elements/services/propertiesService/PropertyType';
import { ValueType } from '../src/elements/services/propertiesService/ValueType';
import { IPropertiesService } from '../src/elements/services/propertiesService/IPropertiesService';
import { IPropertyEditor } from '../src/elements/services/propertiesService/IPropertyEditor';

class FakeStyleDeclaration {
  values = new Map<string, { value: string, priority: string }>();

  setProperty(name: string, value: string, priority: string = '') {
    this.values.set(name, { value, priority });
  }

  removeProperty(name: string) {
    this.values.delete(name);
  }
}

const createDesignItem = () => {
  const styles = new Map<string, string>();
  const priorities = new Map<string, boolean>();
  const style = new FakeStyleDeclaration();

  const designItem = {
    name: 'div',
    element: { style },
    _withoutUndoSetStyle(name: string, value: string, important: boolean = false) {
      styles.set(name, value);
      if (important)
        priorities.set(name, true);
      else
        priorities.delete(name);
    },
    _withoutUndoRemoveStyle(name: string) {
      styles.delete(name);
      priorities.delete(name);
    },
    getStyle(name: string) {
      return styles.get(name);
    },
    isStyleImportant(name: string) {
      return priorities.get(name) === true;
    }
  } as unknown as IDesignItem;

  return { designItem, style };
};

test('splits and appends css important markers', () => {
  expect(splitCssImportant('red !important')).toEqual({ value: 'red', important: true });
  expect(splitCssImportant('calc(100% - 2px) ! important  ')).toEqual({ value: 'calc(100% - 2px)', important: true });
  expect(splitCssImportant('red')).toEqual({ value: 'red', important: false });
  expect(appendCssImportant('red', true)).toBe('red !important');
  expect(appendCssImportant('red', false)).toBe('red');
});

test('parses inline css priority separately from the declaration value', () => {
  const parser = new CssAttributeParser();
  parser.parse('color: red !important; width: 10px;');

  expect(parser.entries).toEqual([
    { name: 'color', value: 'red', important: true },
    { name: 'width', value: '10px', important: false }
  ]);
});

test('css style change action applies and restores priority', () => {
  const { designItem, style } = createDesignItem();
  designItem._withoutUndoSetStyle('color', 'blue', false);

  const action = new CssStyleChangeAction(designItem, 'color', 'red', 'blue', true, false);

  action.do();
  expect(designItem.getStyle('color')).toBe('red');
  expect(designItem.isStyleImportant('color')).toBe(true);
  expect(style.values.get('color')).toEqual({ value: 'red', priority: 'important' });

  action.undo();
  expect(designItem.getStyle('color')).toBe('blue');
  expect(designItem.isStyleImportant('color')).toBe(false);
  expect(style.values.get('color')).toEqual({ value: 'blue', priority: '' });
});

test('css property editor keeps important out of the wrapped editor value', async () => {
  const originalDocument = (<any>globalThis).document;
  const createElement = (tagName: string) => ({
    tagName,
    type: '',
    title: '',
    disabled: false,
    dataset: {},
    style: {},
    children: [],
    classList: { add() { }, remove() { } },
    appendChild(child: unknown) {
      this.children.push(child);
    }
  });
  (<any>globalThis).document = { createElement };

  try {
    let setValue: unknown;
    const service = {
      setValue: async (_designItems, _property, value) => { setValue = value; }
    } as IPropertiesService;

    let innerValue: unknown;
    let innerEditor: IPropertyEditor;
    const editor = new CssPropertyEditor({
      name: 'color',
      type: 'css-color',
      service,
      propertyType: PropertyType.cssValue
    }, property => {
      innerEditor = {
        element: createElement('input') as unknown as Element,
        property,
        designItems: [],
        designItemsChanged(designItems) { this.designItems = designItems; },
        refreshValue(_valueType, value) { innerValue = value; },
        refreshValueWithoutNotification(_valueType, value) { innerValue = value; }
      };
      return innerEditor;
    });

    editor.designItemsChanged([{} as IDesignItem]);
    editor.refreshValueWithoutNotification(ValueType.all, 'red !important');

    expect(innerValue).toBe('red');
    expect((<any>editor)._importantButton.dataset.checked).toBe('true');

    await innerEditor.property.service.setValue(editor.designItems, innerEditor.property, 'blue');
    expect(setValue).toBe('blue !important');

    (<any>editor)._importantButton.dataset.checked = 'false';
    await innerEditor.property.service.setValue(editor.designItems, innerEditor.property, 'green');
    expect(setValue).toBe('green');
  } finally {
    (<any>globalThis).document = originalDocument;
  }
});
