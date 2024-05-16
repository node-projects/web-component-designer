export function isVisualSvgElement(element: SVGElement) {
    let el: Element = element;
    while (el) {
        if (el instanceof (el.ownerDocument.defaultView ?? window).SVGSVGElement)
            return true;
        if (el instanceof (el.ownerDocument.defaultView ?? window).SVGDefsElement)
            return false;
        if (el instanceof (el.ownerDocument.defaultView ?? window).SVGMetadataElement)
            return false;
        el = el.parentElement;
    }
    return true;
}