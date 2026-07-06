import { IDesignerAddonJson } from "../services/designerAddons/IDesignerAddonJson.js";
import { IElementsJson } from "../services/elementsService/IElementsJson.js";
import { PreDefinedElementsService } from "../services/elementsService/PreDefinedElementsService.js";
import { WebcomponentManifestElementsService } from "../services/elementsService/WebcomponentManifestElementsService.js";
import { WebcomponentManifestPropertiesService } from "../services/propertiesService/services/WebcomponentManifestPropertiesService.js";
import { ServiceContainer } from "../services/ServiceContainer.js";
import { removeLeading, removeTrailing } from "./Helper.js";
import { ObservedCustomElementsRegistry } from "./ObservedCustomElementsRegistry.js";

export class NpmPackageLoader {

    private static registryPatchedTohandleErrors: boolean;

    private static packageHacks;

    //packageSource = '//unpkg.com/';
    private _packageSource: string;
    private _dependecies = new Map<string, boolean>();

    constructor(packageSource: string = '//cdn.jsdelivr.net/npm/') {
        this._packageSource = packageSource;
        NpmPackageLoader.patchCustomElementsRegistryToHandleErrors();
    }

    static patchCustomElementsRegistryToHandleErrors() {
        if (!NpmPackageLoader.registryPatchedTohandleErrors) {
            NpmPackageLoader.registryPatchedTohandleErrors = true;
            let customElementsRegistry = window.customElements;
            const registry: any = {};
            registry.define = function (name, constructor, options) {
                try {
                    customElementsRegistry.define(name, constructor, options);
                }
                catch (err) {
                    console.warn(err);
                }
            }
            registry.get = function (name) {
                return customElementsRegistry.get(name);
            }
            registry.upgrade = function (node) {
                return customElementsRegistry.upgrade(node);
            }
            registry.whenDefined = function (name) {
                return customElementsRegistry.whenDefined(name);
            }

            Object.defineProperty(window, "customElements", {
                get() {
                    return registry
                }
            });
        }
    }

    public static getPackageHack(pkg: string) {
        let packageHack = NpmPackageLoader.packageHacks?.[pkg];
        if (!packageHack) {
            const wildcardPackage = Object.keys(NpmPackageLoader.packageHacks ?? {}).find(x => x.endsWith('*') && pkg.startsWith(x.substring(0, x.length - 1)));
            packageHack = NpmPackageLoader.packageHacks?.[wildcardPackage];
        }
        return packageHack;
    }

    private static getExportImport(obj: any): string {
        if (typeof obj == 'string')
            return obj;
        if (Array.isArray(obj)) {
            for (const entry of obj) {
                const imp = NpmPackageLoader.getExportImport(entry);
                if (imp)
                    return imp;
            }
            return null;
        }
        if (!obj)
            return null;

        const conditions = ['browser', 'import', 'module', 'default', 'node'];
        for (const condition of conditions) {
            const imp = NpmPackageLoader.getExportImport(obj[condition]);
            if (imp)
                return imp;
        }
        return null;
    }

    private static addExportsToImportMap(imports: Record<string, string>, baseUrl: string, packageJsonObj: { name?: string, exports?: any }) {
        const normalizedExportPath = (path: string) => baseUrl + removeLeading(removeLeading(path, '.'), '/');
        const addExport = (specifier: string, exportEntry: any) => {
            const imp = NpmPackageLoader.getExportImport(exportEntry);
            if (imp)
                imports[specifier] = normalizedExportPath(imp);
        }

        const exports = packageJsonObj.exports;
        if (!exports)
            return;

        const rootExport = NpmPackageLoader.getExportImport(exports);
        if (rootExport) {
            imports[packageJsonObj.name] = normalizedExportPath(rootExport);
            return;
        }

        for (const exportName in exports) {
            if (exportName.includes('*'))
                continue;
            if (exportName == '.') {
                addExport(packageJsonObj.name, exports[exportName]);
            } else if (exportName.startsWith('./')) {
                addExport(packageJsonObj.name + '/' + exportName.substring(2), exports[exportName]);
            }
        }
    }

    private async getRegisteredElementTags(serviceContainer: ServiceContainer): Promise<Set<string>> {
        const tags = new Set<string>();
        for (const elementsService of serviceContainer.elementsServices) {
            try {
                for (const element of await elementsService.getElements()) {
                    tags.add(element.tag);
                }
            } catch (err) {
                console.warn('error reading registered elements service', err);
            }
        }
        return tags;
    }

    private async loadDependencyCustomElementsJson(dependencies: Record<string, string>, serviceContainer: ServiceContainer, registeredTags: Set<string>): Promise<Set<string>> {
        const addedTags = new Set<string>();
        if (!dependencies)
            return addedTags;

        for (const dependency of Object.keys(dependencies)) {
            if (dependency.startsWith('@types'))
                continue;

            try {
                const dependencyTags = await this.loadPackageCustomElementsJson(dependency, serviceContainer, registeredTags);
                dependencyTags.forEach(tag => addedTags.add(tag));
            } catch (err) {
                console.warn('error loading dependency custom-elements.json: ', dependency, err);
            }
        }
        return addedTags;
    }

    private async loadPackageCustomElementsJson(pkg: string, serviceContainer: ServiceContainer, registeredTags: Set<string>): Promise<Set<string>> {
        const addedTags = new Set<string>();
        const baseUrl = window.location.protocol + this._packageSource + pkg + '/';
        const packageJson = await fetch(baseUrl + 'package.json');
        if (!packageJson.ok)
            return addedTags;

        const packageJsonObj = await packageJson.json();
        let customElementsUrl = baseUrl + 'custom-elements.json';
        let elementsRootPath = baseUrl;
        if (packageJsonObj.customElements) {
            customElementsUrl = baseUrl + removeLeading(removeTrailing(packageJsonObj.customElements, '/'), '/');
            if (customElementsUrl.includes('/')) {
                let idx = customElementsUrl.lastIndexOf('/');
                elementsRootPath = customElementsUrl.substring(0, idx + 1);
            }
        }

        const customElementsJson = await fetch(customElementsUrl);
        if (!customElementsJson.ok)
            return addedTags;

        const customElementsJsonObj = await customElementsJson.json();
        const elements = new WebcomponentManifestElementsService(packageJsonObj.name ?? pkg, elementsRootPath, customElementsJsonObj);
        const elementDefinitions = await elements.getElements();
        const newElementDefinitions = elementDefinitions.filter(elementDefinition => !registeredTags.has(elementDefinition.tag));
        newElementDefinitions.forEach(elementDefinition => addedTags.add(elementDefinition.tag));
        if (addedTags.size === 0)
            return addedTags;

        serviceContainer.register('elementsService', new PreDefinedElementsService(packageJsonObj.name ?? pkg, { elements: newElementDefinitions }));
        const properties = new WebcomponentManifestPropertiesService(packageJsonObj.name ?? pkg, customElementsJsonObj);
        serviceContainer.register('propertyService', properties);
        addedTags.forEach(tag => registeredTags.add(tag));
        return addedTags;
    }

    //TODO: remove paletteTree form params. elements should be added to serviceconatiner, and the container should notify
    async loadNpmPackage(pkg: string, serviceContainer?: ServiceContainer, paletteTree?: any, loadAllImports?: boolean, reportState?: (state: string) => void): Promise<{ html: string, style: string }> {
        if (!NpmPackageLoader.packageHacks) {
            NpmPackageLoader.packageHacks = (await import("./NpmPackageHacks.json", { assert: { type: 'json' } })).default;
        }

        const baseUrl = window.location.protocol + this._packageSource + pkg + '/';

        const packageJsonUrl = baseUrl + 'package.json';
        if (reportState)
            reportState(pkg + ": loading package.json");
        const packageJson = await fetch(packageJsonUrl);
        const packageJsonObj = await packageJson.json();
        const packageHack = NpmPackageLoader.getPackageHack(pkg);

        this.addToImportmap(baseUrl, packageJsonObj);

        const depPromises: Promise<void>[] = []
        if (packageJsonObj.dependencies) {
            for (let d in packageJsonObj.dependencies) {
                depPromises.push(this.loadDependency(d, packageJsonObj.dependencies[d]));
            }
        }
        if (packageHack?.dependencies) {
            for (let d in packageHack.dependencies) {
                depPromises.push(this.loadDependency(d, packageHack.dependencies[d]));
            }
        }
        await Promise.all(depPromises)
        let customElementsUrl = baseUrl + 'custom-elements.json';
        let elementsRootPath = baseUrl;
        if (packageJsonObj.customElements) {
            customElementsUrl = baseUrl + removeTrailing(packageJsonObj.customElements, '/');
            if (customElementsUrl.includes('/')) {
                let idx = customElementsUrl.lastIndexOf('/');
                elementsRootPath = customElementsUrl.substring(0, idx + 1);
            }
        }
        let webComponentDesignerUrl = baseUrl + 'web-component-designer.json';
        if (packageJsonObj.webComponentDesigner) {
            webComponentDesignerUrl = baseUrl + removeLeading(packageJsonObj.webComponentDesigner, '/');
        }
        if (reportState)
            reportState(pkg + ": loading custom-elements.json");
        let customElementsJson = await fetch(customElementsUrl);

        if (!customElementsJson.ok && packageJsonObj.homepage) {
            try {
                const url = new URL(packageJsonObj.homepage);
                const newurl = 'https://raw.githubusercontent.com/' + url.pathname + '/master/custom-elements.json';
                customElementsJson = await fetch(newurl);
                console.warn("custom-elements.json was missing from npm package, but was loaded from github as a fallback.")
            }
            catch (err) {
                console.warn("github custom elments json fallback", err);
            }
        }

        if (serviceContainer) {
            fetch(webComponentDesignerUrl).then(async x => {
                if (x.ok) {
                    const webComponentDesignerJson = <IDesignerAddonJson>await x.json();
                    if (webComponentDesignerJson.services) {
                        for (let o in webComponentDesignerJson.services) {
                            for (let s of webComponentDesignerJson.services[o]) {
                                if (s.startsWith('./'))
                                    s = s.substring(2);
                                //@ts-ignore
                                const classDefinition = (await importShim(baseUrl + s)).default;
                                //@ts-ignore
                                serviceContainer.register(o, new classDefinition());
                            }
                        }
                    }
                }
            });
        }

        if (customElementsJson.ok) {
            const customElementsJsonObj = await customElementsJson.json();
            let elements = new WebcomponentManifestElementsService(packageJsonObj.name, elementsRootPath, customElementsJsonObj);
            if (serviceContainer)
                serviceContainer.register('elementsService', elements);
            if (serviceContainer) {
                let properties = new WebcomponentManifestPropertiesService(packageJsonObj.name, customElementsJsonObj);
                serviceContainer.register('propertyService', properties);
            }

            if (loadAllImports) {
                for (let e of await elements.getElements()) {
                    //@ts-ignore
                    importShim(e.import);
                }
            }

            if (serviceContainer && paletteTree) {
                //TODO: should be retriggered by service container, or changeing list in container
                paletteTree.loadControls(serviceContainer, serviceContainer.elementsServices);
            }

            /* Package Hacks */
            if (packageHack?.import) {
                import(packageHack.import);
            }
            if (packageHack?.script) {
                const scriptUrl = URL.createObjectURL(new Blob([packageHack.script], { type: 'application/javascript' }));
                import(scriptUrl);
            }
        } else {
            console.warn('npm package: ' + pkg + ' - no custom-elements.json found, only loading javascript module');

            const registeredTags = serviceContainer ? await this.getRegisteredElementTags(serviceContainer) : new Set<string>();
            const dependencyCustomElementsTags = serviceContainer
                ? await this.loadDependencyCustomElementsJson({ ...packageJsonObj.dependencies, ...packageHack?.dependencies }, serviceContainer, registeredTags)
                : new Set<string>();
            const observedCustomElementsRegistry = new ObservedCustomElementsRegistry();

            if (packageJsonObj.module) {
                //@ts-ignore
                await importShim(baseUrl + removeLeading(packageJsonObj.module, '/'))
            } else if (packageJsonObj.main) {
                //@ts-ignore
                await importShim(baseUrl + removeLeading(packageJsonObj.main, '/'))
            } else if (packageJsonObj.unpkg) {
                //@ts-ignore
                await importShim(baseUrl + removeLeading(packageJsonObj.unpkg, '/'))
            } else {
                console.warn('npm package: ' + pkg + ' - no entry point in package found.');
            }

            /* Package Hacks */
            if (packageHack?.import) {
                await import(packageHack.import);
            }
            if (packageHack?.script) {
                const scriptUrl = URL.createObjectURL(new Blob([packageHack.script], { type: 'application/javascript' }));
                await import(scriptUrl);
            }

            const newElements = observedCustomElementsRegistry.getNewElements().filter(tag => !registeredTags.has(tag) && !dependencyCustomElementsTags.has(tag));
            if (newElements.length > 0 && serviceContainer && paletteTree) {
                const elementsCfg: IElementsJson = {
                    elements: newElements.map(tag => ({ tag, packageName: packageJsonObj.name ?? pkg }))
                }
                let elService = new PreDefinedElementsService(pkg, elementsCfg)
                serviceContainer.register('elementsService', elService);
            }

            if ((dependencyCustomElementsTags.size > 0 || newElements.length > 0) && serviceContainer && paletteTree)
                paletteTree.loadControls(serviceContainer, serviceContainer.elementsServices);

            observedCustomElementsRegistry.dispose();
        }
        if (reportState)
            reportState(pkg + ": done");

        let retVal: any = {};

        if (packageHack?.html) {
            retVal.html = (<string>packageHack.html).replaceAll("${baseUrl}", baseUrl);
        }
        if (packageHack?.style) {
            retVal.style = (<string>packageHack.style).replaceAll("${baseUrl}", baseUrl);
        }
        return retVal;
    }

    async loadDependency(dependency: string, version?: string, reportState?: (state: string) => void) {
        if (this._dependecies.has(dependency))
            return;

        this._dependecies.set(dependency, true);

        if (dependency.startsWith('@types')) {
            console.warn('ignoring wrong dependency: ', dependency);
            return;
        }
        if (reportState)
            reportState(dependency + ": loading dependency: " + dependency);
        const baseUrl = window.location.protocol + this._packageSource + dependency + '/';

        const packageJsonUrl = baseUrl + 'package.json';
        const packageJson = await fetch(packageJsonUrl);
        const packageJsonObj = await packageJson.json();

        const depPromises: Promise<void>[] = []
        if (packageJsonObj.dependencies) {
            for (let d in packageJsonObj.dependencies) {
                depPromises.push(this.loadDependency(d, packageJsonObj.dependencies[d]));
            }
        }
        await Promise.all(depPromises)

        this.addToImportmap(baseUrl, packageJsonObj);
    }

    async addToImportmap(baseUrl: string, packageJsonObj: { name?: string, module?: string, main?: string, unpkg?: string, exports?: any }) {
        //@ts-ignore
        const map = importShim.getImportMap().imports;
        const importMap = { imports: {}, scopes: {} };

        if (!map.hasOwnProperty(packageJsonObj.name)) {
            if (packageJsonObj.exports) {
                NpmPackageLoader.addExportsToImportMap(importMap.imports, baseUrl, packageJsonObj);
            }

            let mainImport = packageJsonObj.main;
            if (packageJsonObj.module)
                mainImport = packageJsonObj.module;
            if (packageJsonObj.unpkg && !mainImport)
                mainImport = packageJsonObj.unpkg;
            if (!importMap.imports[packageJsonObj.name]) {
                if (mainImport)
                    importMap.imports[packageJsonObj.name] = baseUrl + removeLeading(removeLeading(mainImport, '.'), '/');
                else
                    console.warn('package: ' + baseUrl + 'no main import found');
            }

            importMap.imports[packageJsonObj.name + '/'] = baseUrl;

            const packageHack = NpmPackageLoader.getPackageHack(packageJsonObj.name);
            if (packageHack?.map) {
                for (let h in packageHack.map) [
                    importMap.imports[h] = baseUrl + packageHack.map[h]
                ]
            }

            //@ts-ignore
            importShim.addImportMap(importMap);
        }
    }
}
