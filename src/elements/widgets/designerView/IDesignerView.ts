export interface IDesignerView {
  getHTML(): string;
  parseHTML(html: string): void;
}