import { ServiceContainer } from "../../services/ServiceContainer";

export interface IDesignerView {
  initialize(serviceContainer: ServiceContainer);
  getHTML(): string;
  parseHTML(html: string): void;
}