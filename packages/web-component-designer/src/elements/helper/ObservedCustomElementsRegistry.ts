import { IDisposable } from "../../interfaces/IDisposable.js";

export class ObservedCustomElementsRegistry implements IDisposable {

    private _originalCustomElementsRegistry: CustomElementRegistry
    private _newElements: string[] = [];

    constructor() {
        this._originalCustomElementsRegistry = window.customElements;
        
        const registry: any = {};
        const originalCustomElementsRegistry = this._originalCustomElementsRegistry
        const newElements = this._newElements
        
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
                return registry;
            }
        });
    }

    dispose(): void {
        const orgReg = this._originalCustomElementsRegistry;
        Object.defineProperty(window, "customElements", {
            get() {
                return orgReg;
            }
        });
    }

    getNewElements(): string[] {
        const newElements = this._newElements;
        this._newElements = [];
        return newElements;
    }
}