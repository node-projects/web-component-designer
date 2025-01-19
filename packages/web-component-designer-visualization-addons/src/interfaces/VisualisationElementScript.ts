export interface VisualisationElementScript {
    init?(instance: HTMLElement, shadowRoot: ShadowRoot);

    connectedCallback?(instance: HTMLElement, shadowRoot: ShadowRoot);
    disconnectedCallback?(instance: HTMLElement, shadowRoot: ShadowRoot);
}