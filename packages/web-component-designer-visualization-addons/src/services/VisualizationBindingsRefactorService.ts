import { IBinding, IDesignItem, IRefactoring, IRefactorService } from "@node-projects/web-component-designer";


export class VisualizationBindingsRefactorService implements IRefactorService {
    getRefactorings(designItems: IDesignItem[]): IRefactoring[] {
        let refactorings: (IRefactoring & { shortName?: string, prefix?: string })[] = [];
        for (let d of designItems) {
            let bindings = d.serviceContainer.bindingService.getBindings(d);
            if (bindings) {
                for (let b of bindings) {
                    for (let s of b.bindableObjectNames) {
                        let itemType = 'signal';
                        let prefix = ""
                        if (s.includes(':')) {
                            let nm = s.split(':')[0];
                            let sng = s.substring(nm.length + 1);
                            if (sng.startsWith('?')) {
                                sng = sng.substring(1);
                                prefix = '?';
                                itemType = 'property';
                                if (sng.startsWith('?')) {
                                    sng = sng.substring(1);
                                    prefix = '??';
                                }
                            }
                            refactorings.push({ service: this, name: sng, itemType: itemType, designItem: d, type: 'binding', sourceObject: b, display: b.target + '/' + b.targetName + ' - ' + nm + ':', shortName: nm, prefix: prefix });
                        } else {
                            if (s.startsWith('?')) {
                                s = s.substring(1);
                                prefix = '?';
                                itemType = 'property';
                                if (s.startsWith('?')) {
                                    s = s.substring(1);
                                    prefix = '??';
                                }
                            }
                            refactorings.push({ service: this, name: s, itemType: itemType, designItem: d, type: 'binding', sourceObject: b, display: b.target + '/' + b.targetName, prefix: prefix });
                        }
                    }
                }
            }
        }
        return refactorings;
    }

    refactor(refactoring: (IRefactoring & { shortName?: string, prefix?: string }), oldValue: string, newValue: string) {
        let binding = refactoring.sourceObject as IBinding;
        if (refactoring.shortName)
            binding.bindableObjectNames = binding.bindableObjectNames.map(x => x == refactoring.shortName + ':' + refactoring.prefix + oldValue ? refactoring.shortName + ':' + refactoring.prefix + newValue : x);
        else
            binding.bindableObjectNames = binding.bindableObjectNames.map(x => x == refactoring.prefix + oldValue ? refactoring.prefix + newValue : x);
        refactoring.designItem.serviceContainer.bindingService.setBinding(refactoring.designItem, binding);
    }
}