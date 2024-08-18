export { };

declare global {
    interface Node {
        convertQuadFromNode(quad: DOMQuadInit, from: Element, options?: { fromBox?: 'margin' | 'border' | 'padding' | 'content', toBox?: 'margin' | 'border' | 'padding' | 'content' }): DOMQuad
        convertRectFromNode(rect: DOMRectReadOnly, from: Element, options?: { fromBox?: 'margin' | 'border' | 'padding' | 'content', toBox?: 'margin' | 'border' | 'padding' | 'content' }): DOMRect
        convertPointFromNode(point: DOMPointInit, from: Element, options?: { fromBox?: 'margin' | 'border' | 'padding' | 'content', toBox?: 'margin' | 'border' | 'padding' | 'content' }): DOMPoint
        getBoxQuads(options?: { box?: 'margin' | 'border' | 'padding' | 'content', relativeTo?: Element }): DOMQuad[]
    }
}