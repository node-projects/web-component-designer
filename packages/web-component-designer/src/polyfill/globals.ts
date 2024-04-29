export { };

declare global {
  interface Window { }
  interface ShadowRoot {
    adoptedStyleSheets: CSSStyleSheet[];
  }

  interface Function {
    style: CSSStyleSheet;
    svgDefs: string;
  }
}