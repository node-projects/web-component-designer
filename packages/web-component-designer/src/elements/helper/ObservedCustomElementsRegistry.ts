import { IDisposable } from "../../interfaces/IDisposable.js";

export class ObservedCustomElementsRegistry implements IDisposable {

    //@ts-ignore
    #originalCustomElementsRegistry: CustomElementRegistry
    #newElements: string[] = [];

    constructor() {
        this.#originalCustomElementsRegistry = window.customElements;
        const registry: any = {};
        registry.define = function (name, constructor, options) {
            this.#newElements.push(name);
            this.#originalCustomElementsRegistry.define(name, constructor, options);
        }
        registry.get = function (name) {
            return this.#originalCustomElementsRegistry.get(name);
        }
        registry.upgrade = function (node) {
            return this.#originalCustomElementsRegistry.upgrade(node);
        }
        registry.whenDefined = function (name) {
            return this.#originalCustomElementsRegistry.whenDefined(name);
        }

        Object.defineProperty(window, "customElements", {
            get() {
                return registry;
            }
        });
    }

    dispose(): void {
        Object.defineProperty(window, "customElements", {
            get() {
                return this.#originalCustomElementsRegistry;
            }
        });
    }

    getNewElements(): string[] {
        const newElements = this.#newElements;
        this.#newElements = [];
        return newElements;
    }
}