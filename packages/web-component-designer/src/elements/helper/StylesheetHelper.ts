export function stylesheetFromString(window: Window, text: string) {
    //@ts-ignore
    const newStylesheet = new window.CSSStyleSheet();
    newStylesheet.replaceSync(text);
    return newStylesheet;
}

export function stylesheetToString(stylesheet: CSSStyleSheet) {
    return Array.from(stylesheet.cssRules).map(rule => rule.cssText).join('\n');
}