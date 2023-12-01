import { IBinding } from "../../item/IBinding.js";
import { IDesignItem } from "../../item/IDesignItem.js";
import { IRefactoring } from "./IRefactoring.js";

export class BindingsRefactorService {
    getRefactorings(designItems: IDesignItem[]): IRefactoring[] {
        let refactorings: IRefactoring[] = [];
        for (let d of designItems) {
            let bindings = d.serviceContainer.bindingService.getBindings(d);
            if (bindings) {
                for (let b of bindings) {
                    for (let s of b.bindableObjectNames) {
                        refactorings.push({ service: this, name: s, designItem: d, type: 'binding', sourceObject: b, display: b.target + '(' + b.targetName + ')' });
                    }
                }
            }
        }
        return refactorings;
    }

    refactor(refactoring: IRefactoring, oldValue: string, newValue: string) {
        let binding = refactoring.sourceObject as IBinding;
        binding.bindableObjectNames = binding.bindableObjectNames.map(x => x == oldValue ? newValue : x);
        refactoring.designItem.serviceContainer.bindingService.setBinding(refactoring.designItem, binding);
    }
}