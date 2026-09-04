import { IBinding, IDesignItem, IRefactoring, IRefactorService } from "@node-projects/web-component-designer";

const sourcePrefixes = [
    { prefix: '?@', itemType: 'attribute' },
    { prefix: '#@', itemType: 'attribute' },
    { prefix: '?$', itemType: 'signalObject' },
    { prefix: '#$', itemType: 'signalObject' },
    { prefix: '??', itemType: 'property' },
    { prefix: '##', itemType: 'property' },
    { prefix: '?', itemType: 'property' },
    { prefix: '#', itemType: 'property' }
];

function parseSource(source: string) {
    const match = sourcePrefixes.find(x => source.startsWith(x.prefix));
    return match
        ? { name: source.substring(match.prefix.length), ...match }
        : { name: source, prefix: '', itemType: 'signal' };
}

export class VisualizationBindingsRefactorService implements IRefactorService {
    getRefactorings(designItems: IDesignItem[]): IRefactoring[] {
        let refactorings: (IRefactoring & { shortName?: string, prefix?: string })[] = [];
        for (let d of designItems) {
            let bindings = d.serviceContainer.bindingService.getBindings(d);
            if (bindings) {
                for (let b of bindings) {
                    for (let s of b.bindableObjectNames) {
                        if (s.includes(':')) {
                            let nm = s.split(':')[0];
                            const source = parseSource(s.substring(nm.length + 1));
                            refactorings.push({ service: this, name: source.name, itemType: source.itemType, designItem: d, type: 'binding', sourceObject: b, display: b.target + '/' + b.targetName + ' - ' + nm + ':', shortName: nm, prefix: source.prefix });
                        } else {
                            const source = parseSource(s);
                            refactorings.push({ service: this, name: source.name, itemType: source.itemType, designItem: d, type: 'binding', sourceObject: b, display: b.target + '/' + b.targetName, prefix: source.prefix });
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
