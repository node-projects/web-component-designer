import { IDesignerAddonJson } from "../services/designerAddons/IDesignerAddonJson.js";
import { IElementsJson } from "../services/elementsService/IElementsJson.js";
import { PreDefinedElementsService } from "../services/elementsService/PreDefinedElementsService.js";
import { WebcomponentManifestElementsService } from "../services/elementsService/WebcomponentManifestElementsService.js";
import { WebcomponentManifestPropertiesService } from "../services/propertiesService/services/WebcomponentManifestPropertiesService.js";
import { ServiceContainer } from "../services/ServiceContainer.js";
import { removeLeading, removeTrailing } from "./Helper.js";
import packageHacks from "./NpmPackageHacks.json" with { type: 'json' };

export class NpmPackageLoader {

    private static registryPatchedTohandleErrors: boolean;

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

    //TODO: remove paletteTree form params. elements should be added to serviceconatiner, and the container should notify
    async loadNpmPackage(pkg: string, serviceContainer?: ServiceContainer, paletteTree?: any, loadAllImports?: boolean, reportState?: (state: string) => void): Promise<{ html: string, style: string }> {
        const baseUrl = window.location.protocol + this._packageSource + pkg + '/';

        const packageJsonUrl = baseUrl + 'package.json';
        if (reportState)
            reportState(pkg + ": loading package.json");
        const packageJson = await fetch(packageJsonUrl);
        const packageJsonObj = await packageJson.json();

        this.addToImportmap(baseUrl, packageJsonObj);

        const depPromises: Promise<void>[] = []
        if (packageJsonObj.dependencies) {
            for (let d in packageJsonObj.dependencies) {
                depPromises.push(this.loadDependency(d, packageJsonObj.dependencies[d]));
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
            if (packageHacks[pkg]?.import) {
                import(packageHacks[pkg]?.import);
            }
            if (packageHacks[pkg]?.script) {
                const scriptUrl = URL.createObjectURL(new Blob([packageHacks[pkg]?.script], { type: 'application/javascript' }));
                import(scriptUrl);
            }
        } else {
            console.warn('npm package: ' + pkg + ' - no custom-elements.json found, only loading javascript module');

            let originalCustomElementsRegistry = window.customElements;
            const registry: any = {};
            const newElements: string[] = [];
            registry.define = function (name, constructor, options) {
                newElements.push(name);
                originalCustomElementsRegistry.define(name, constructor, options);
            }
            registry.get = function (name) {
                return originalCustomElementsRegistry.get(name);
            }
            registry.upgrade = function (node) {
                return originalCustomElementsRegistry.upgrade(node);
            }
            registry.whenDefined = function (name) {
                return originalCustomElementsRegistry.whenDefined(name);
            }

            Object.defineProperty(window, "customElements", {
                get() {
                    return registry
                }
            });

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
            if (packageHacks[pkg]?.import) {
                await import(packageHacks[pkg]?.import);
            }
            if (packageHacks[pkg]?.script) {
                const scriptUrl = URL.createObjectURL(new Blob([packageHacks[pkg]?.script], { type: 'application/javascript' }));
                await import(scriptUrl);
            }

            if (newElements.length > 0 && serviceContainer && paletteTree) {
                const elementsCfg: IElementsJson = {
                    elements: newElements
                }
                let elService = new PreDefinedElementsService(pkg, elementsCfg)
                serviceContainer.register('elementsService', elService);
                paletteTree.loadControls(serviceContainer, serviceContainer.elementsServices);
            }

            Object.defineProperty(window, "customElements", {
                get() {
                    return originalCustomElementsRegistry;
                }
            });
        }
        if (reportState)
            reportState(pkg + ": done");

        let retVal: any = {};

        if (packageHacks[pkg]?.html) {
            retVal.html = (<string>packageHacks[pkg]?.html).replaceAll("${baseUrl}", baseUrl);
        }
        if (packageHacks[pkg]?.style) {
            retVal.style = (<string>packageHacks[pkg]?.style).replaceAll("${baseUrl}", baseUrl);
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

    async addToImportmap(baseUrl: string, packageJsonObj: { name?: string, module?: string, main?: string, unpkg?: string, exports?: Record<string, string> }) {
        //@ts-ignore
        const map = importShim.getImportMap().imports;
        const importMap = { imports: {}, scopes: {} };

        if (!map.hasOwnProperty(packageJsonObj.name)) {
            //TODO: use exports of package.json for importMap
            if (packageJsonObj.exports) {

                /* "exports": {
                ".": {
                    "browser": "./index.browser.js",
                    "default": "./index.js"
                },
                "./async": {
                    "browser": "./async/index.browser.js",
                    "default": "./async/index.js"
                },
                "./non-secure": "./non-secure/index.js",
                "./package.json": "./package.json"
            }
           
            "exports": {
                "node": {
                  "import": "./feature-node.mjs",
                  "require": "./feature-node.cjs"
                },
                "default": "./feature.mjs"
              }
            
            
               "exports": {
                ".": "./index.js",
                "./feature.js": {
                  "node": "./feature-node.js",
                  "default": "./feature.js"
                }
              }

            "exports": {
                ".": {
                    "types": "./dist/index.d.ts",
                    "import": {
                        "browser": {
                            "development": "./dist/composed-offset-position.browser.mjs",
                            "default": "./dist/composed-offset-position.browser.min.mjs"
                        },
                        "default": "./dist/composed-offset-position.mjs"
                    },
                    "module": "./dist/composed-offset-position.esm.js",
                    "default": "./dist/composed-offset-position.umd.js"
                },
                "./package.json": "./package.json"
            }
            
            */

                /*  
                "exports": {
                    "import": "./index-module.js",
                    "require": "./index-require.cjs"
                }, 
                */
                let getImport = (obj: any) => {
                    if (obj?.browser)
                        return obj.browser;
                    if (obj?.import)
                        return obj.import;
                    if (obj?.module)
                        return obj.module;
                    if (obj?.default)
                        return obj.default;
                    return obj?.node;
                }
                /*
                for support of this:
                "exports": {
                ".": {
                    "types": "./dist/index.d.ts",
                    "import": {
                        "browser": {
                            "development": "./dist/composed-offset-position.browser.mjs",
                            "default": "./dist/composed-offset-position.browser.min.mjs"
                        },
                */
                let getImportFlat = (obj: any) => {
                    let i = getImport(obj);
                    if (!(typeof i == 'string'))
                        i = getImport(i);
                    if (!(typeof i == 'string'))
                        i = getImport(i);
                    if (!(typeof i == 'string'))
                        i = null;
                    return i;
                }
                //Names to use: browser, import, default, node
                let imp = getImportFlat(packageJsonObj.exports);
                if (imp) {
                    importMap.imports[packageJsonObj.name] = baseUrl + removeLeading(removeLeading(imp, '.'), '/');
                } else if (imp = getImportFlat(packageJsonObj.exports?.['.'])) {
                    importMap.imports[packageJsonObj.name] = baseUrl + removeLeading(removeLeading(imp, '.'), '/');
                }
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

            if (packageHacks[packageJsonObj.name]?.map) {
                for (let h in packageHacks[packageJsonObj.name]?.map) [
                    importMap.imports[h] = baseUrl + packageHacks[packageJsonObj.name].map[h]
                ]
            }

            //@ts-ignore
            importShim.addImportMap(importMap);
        }
    }
}
