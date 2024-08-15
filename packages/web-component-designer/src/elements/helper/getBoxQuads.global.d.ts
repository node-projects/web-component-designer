export { };

declare global {
    interface Node {
        convertQuadFromNode(quad: DOMQuadInit, from: Element, options?: { fromBox?: 'margin' | 'border' | 'padding' | 'content', toBox?: 'margin' | 'border' | 'padding' | 'content' })
        convertRectFromNode(rect: DOMRectReadOnly, from: Element, options?: { fromBox?: 'margin' | 'border' | 'padding' | 'content', toBox?: 'margin' | 'border' | 'padding' | 'content' })
        convertPointFromNode(point: DOMPointInit, from: Element, options?: { fromBox?: 'margin' | 'border' | 'padding' | 'content', toBox?: 'margin' | 'border' | 'padding' | 'content' })
        getBoxQuads(options?: { box?: 'margin' | 'border' | 'padding' | 'content', relativeTo?: Element })
    }
}