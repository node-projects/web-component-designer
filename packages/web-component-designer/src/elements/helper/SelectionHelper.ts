export function shadowrootGetSelection(shadowRoot: ShadowRoot) {
    let selection = document.getSelection();
    if ((<any>selection).getComposedRanges)
        selection = (<any>selection).getComposedRanges(shadowRoot);
    else if ((<any>shadowRoot).getSelection)
        selection = (<any>shadowRoot).getSelection();
    return selection;
}

function wrapTextNodesInSpan(range: Range, spans: HTMLSpanElement[]) {
    function wrapNode(node) {
        const span = document.createElement('span');
        spans.push(span);
        node.parentNode.insertBefore(span, node);
        span.appendChild(node);
    }

    function processNode(node) {
        switch (node.nodeType) {
            case Node.TEXT_NODE:
                wrapNode(node);
                break;
            case Node.DOCUMENT_FRAGMENT_NODE:
            case Node.ELEMENT_NODE:
                Array.from(node.childNodes).forEach(processNode);
                break;
        }
    }

    const fragment = range.extractContents();
    processNode(fragment);
    range.insertNode(fragment);
}

function staticRangeToRange(staticRange) {
    const range = document.createRange();

    range.setStart(staticRange.startContainer, staticRange.startOffset);
    range.setEnd(staticRange.endContainer, staticRange.endOffset);

    return range;
}

export function wrapSelectionInSpans(selection: Selection) {
    const spans: HTMLSpanElement[] = [];

    if (selection[0] instanceof StaticRange) {
        wrapTextNodesInSpan(staticRangeToRange(selection[0]), spans);
    } else {
        if (!selection.rangeCount)
            return spans;

        const range = selection.getRangeAt(0);
        wrapTextNodesInSpan(range, spans);
    }
    if (selection.removeAllRanges)
        selection.removeAllRanges();

    return spans;
}
