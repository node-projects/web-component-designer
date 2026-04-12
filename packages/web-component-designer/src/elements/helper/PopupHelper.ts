export function showPopup(content: Element, anchorEl: HTMLElement, closedCallback?: () => void): () => void {
    const root = anchorEl.getRootNode();

    // 🧱 Create popup element
    const popupEl = document.createElement('div');

    // Enable Popup API
    popupEl.popover = 'auto';

    // 📦 Insert content
    if (typeof content === 'string') {
        popupEl.innerHTML = content;
    } else {
        popupEl.append(content);
    }

    // 📍 Mount into SAME root (required for anchor positioning)
    if (root instanceof ShadowRoot) {
        root.appendChild(popupEl);
    } else {
        document.body.appendChild(popupEl);
    }

    Object.assign(popupEl.style, {
        positionArea: 'right bottom',
        positionTryFallbacks: `
            flip-block,
            flip-inline,
            top,
            bottom,
            left,
            right
        `
    });

    // 🧹 cleanup when closed
    popupEl.addEventListener('toggle', () => {
        if (!popupEl.matches(':popover-open')) {
            popupEl.remove();
            closedCallback?.();
        }
    }, { once: true });

    // 🚀 Open via Popup API
    popupEl.showPopover({ source: anchorEl });

    // 🔙 return close callback
    return () => {
        if (popupEl.matches(':popover-open')) {
            popupEl.hidePopover();
        }
        popupEl.remove();
        closedCallback?.();
    };
}
