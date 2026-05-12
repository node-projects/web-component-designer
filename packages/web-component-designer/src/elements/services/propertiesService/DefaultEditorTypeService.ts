import { IEditorTypeService } from "./IEditorTypeService";
import { ColorInput } from "../../controls/ColorEditor.js";

export class DefaultEditorTypeService implements IEditorTypeService {
    getEditor(type: string, additional: { changedCallback: (newValue: any) => void, [key: string]: any }): { element: HTMLElement, getValue: () => any, setValue: (value: any) => void } {
        if (type === 'color' || type === 'css-color') {
            const input = document.createElement('node-projects-color-input') as ColorInput;
            input.addEventListener('change', () => additional.changedCallback(input.value));
            return {
                element: input,
                getValue: () => input.value,
                setValue: (value: any) => { input.value = value; }
            };
        }

        const input = document.createElement('input');
        input.type = type;
        if (additional.min !== undefined) input.min = additional.min;
        if (additional.max !== undefined) input.max = additional.max;
        if (additional.step !== undefined) input.step = additional.step;
        input.addEventListener('change', (event) => additional.changedCallback((event.target as HTMLInputElement).value));
        return {
            element: input,
            getValue: () => input.value,
            setValue: (value: any) => { input.value = value; }
        };
    }
}
