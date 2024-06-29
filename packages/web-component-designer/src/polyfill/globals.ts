export { };

declare global {
  interface Window { }

  interface Function {
    style: CSSStyleSheet;
    svgDefs: string;
  }
}