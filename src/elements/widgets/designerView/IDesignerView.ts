import { IDesignItem } from "../../item/IDesignItem";
import { IStringPosition } from "../../services/serializationService/IStringPosition";
import { ServiceContainer } from "../../services/ServiceContainer";

export interface IDesignerView {
  initialize(serviceContainer: ServiceContainer);
  getHTML(designItemsAssignmentList?: Map<IDesignItem, IStringPosition>): string;
  parseHTML(html: string): void;
}