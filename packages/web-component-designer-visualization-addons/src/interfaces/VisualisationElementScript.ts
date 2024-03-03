export interface VisualisationElementScript {
    init?(instance: HTMLElement);

    connectedCallback?(instance: HTMLElement);
    disconnectedCallback?(instance: HTMLElement);
}