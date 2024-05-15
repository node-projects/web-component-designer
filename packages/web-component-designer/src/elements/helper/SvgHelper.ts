export function isVisualSvgElement(element: SVGElement) {
    let el: Element = element;
    while (el) {
        if (el instanceof el.ownerDocument.defaultView.SVGSVGElement)
            return true;
        if (el instanceof el.ownerDocument.defaultView.SVGDefsElement)
            return false;
        if (el instanceof el.ownerDocument.defaultView.SVGMetadataElement)
            return false;
        el = el.parentElement;
    }
    return true;
}