import { IBinding } from "../../item/IBinding.js";
import { IDesignItem } from "../../item/IDesignItem.js";
import { IRefactorService } from "./IRefactorService.js";
import { IRefactoring } from "./IRefactoring.js";

export class BindingsRefactorService implements IRefactorService {
    getRefactorings(designItems: IDesignItem[]): IRefactoring[] {
        let refactorings: (IRefactoring & { shortName?: string })[] = [];
        for (let d of designItems) {
            let bindings = d.serviceContainer.bindingService.getBindings(d);
            if (bindings) {
                for (let b of bindings) {
                    for (let s of b.bindableObjectNames) {
                        if (s.includes(':')) {
                            let nm = s.split(':')[0];
                            let sng = s.substring(nm.length + 1);
                            refactorings.push({ service: this, name: sng, itemType: 'bindableObject', designItem: d, type: 'binding', sourceObject: b, display: b.target + '/' + b.targetName + ' - ' + nm + ':', shortName: nm });
                        } else {
                            refactorings.push({ service: this, name: s, itemType: 'bindableObject', designItem: d, type: 'binding', sourceObject: b, display: b.target + '/' + b.targetName });
                        }
                    }
                }
            }
        }
        return refactorings;
    }

    refactor(refactoring: (IRefactoring & { shortName?: string }), oldValue: string, newValue: string) {
        let binding = refactoring.sourceObject as IBinding;
        if (refactoring.shortName)
            binding.bindableObjectNames = binding.bindableObjectNames.map(x => x == refactoring.shortName + ':' + oldValue ? refactoring.shortName + ':' + newValue : x);
        else
            binding.bindableObjectNames = binding.bindableObjectNames.map(x => x == oldValue ? newValue : x);
        refactoring.designItem.serviceContainer.bindingService.setBinding(refactoring.designItem, binding);
    }
}