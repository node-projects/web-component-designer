export { };

declare global {
    interface Node {
        convertQuadFromNode(quad: DOMQuadInit, from: Element, options?: { fromBox?: 'margin' | 'border' | 'padding' | 'content', toBox?: 'margin' | 'border' | 'padding' | 'content', iframes?: HTMLIFrameElement[] }): DOMQuad
        convertRectFromNode(rect: {x: number, y: number, width: number, height: number}, from: Element, options?: { fromBox?: 'margin' | 'border' | 'padding' | 'content', toBox?: 'margin' | 'border' | 'padding' | 'content', iframes?: HTMLIFrameElement[] }): DOMQuad
        convertPointFromNode(point: DOMPointInit, from: Element, options?: { fromBox?: 'margin' | 'border' | 'padding' | 'content', toBox?: 'margin' | 'border' | 'padding' | 'content', iframes?: HTMLIFrameElement[] }): DOMPoint
        getBoxQuads(options?: { box?: 'margin' | 'border' | 'padding' | 'content', relativeTo?: Element, iframes?: HTMLIFrameElement[] }): DOMQuad[]
    }
}