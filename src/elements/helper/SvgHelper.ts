export function isVisualSvgElement(element: SVGElement) {
    let el: Element = element;
    while (el) {
        if (el instanceof SVGSVGElement)
            return true;
        if (el instanceof SVGDefsElement)
            return false;
        if (el instanceof SVGMetadataElement)
            return false;
        el = el.parentElement;
    }
    return true;
}