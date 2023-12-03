import { IDesignItem } from "../../item/IDesignItem.js";
import { IRefactoring } from "./IRefactoring.js";

export class TextRefactorService {
    getRefactorings(designItems: IDesignItem[]): IRefactoring[] {
        let refactorings: IRefactoring[] = [];
        for (let d of designItems) {
            if (d.element instanceof HTMLInputElement || d.element instanceof HTMLTextAreaElement) {
                if (d.element.value)
                    refactorings.push({ service: this, name: d.element.value, itemType: 'text', designItem: d, type: 'attribute', sourceObject: d, display: 'attribute' + '/' + 'value' });
            }
            if (d.childCount > 0 && d.element.textContent) {
                let onlyTextNodes = true;
                for (const n of d.element.childNodes)
                    if (n.nodeType != 3) {
                        onlyTextNodes = false;
                    }
                if (onlyTextNodes)
                    refactorings.push({ service: this, name: d.element.textContent, itemType: 'text', designItem: d, type: 'content', sourceObject: d, display: 'textContent' });
            }

        }
        return refactorings;
    }

    refactor(refactoring: IRefactoring, oldValue: string, newValue: string) {
        if (refactoring.type == 'attribute') {
            refactoring.designItem.setAttribute('value', newValue);
        } else if (refactoring.type == 'content') {
            refactoring.designItem.content = newValue;
        }
    }
}