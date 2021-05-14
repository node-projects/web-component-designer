import { PointerActionType } from "../../../enums/PointerActionType";
import { IDesignItem } from "../../item/IDesignItem";
import { InstanceServiceContainer } from "../../services/InstanceServiceContainer";
import { IStringPosition } from "../../services/serializationService/IStringPosition";
import { ServiceContainer } from "../../services/ServiceContainer";

export interface IDesignerView {
  serviceContainer: ServiceContainer;
  instanceServiceContainer: InstanceServiceContainer;
  containerBoundingRect: DOMRect;
  rootDesignItem: IDesignItem;
  overlayLayer: SVGElement;

  initialize(serviceContainer: ServiceContainer);
  getHTML(designItemsAssignmentList?: Map<IDesignItem, IStringPosition>): string;
  parseHTML(html: string): void;
  pointerEventHandlerElement(event: PointerEvent, currentElement: Element, forcedAction?: PointerActionType, actionMode?: string)
}