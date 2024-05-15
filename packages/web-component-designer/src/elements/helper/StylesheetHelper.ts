export function stylesheetFromString(window: Window, text: string) {
    //@ts-ignore
    const newStylesheet = new window.CSSStyleSheet();
    newStylesheet.replaceSync(text);
    return newStylesheet;
}