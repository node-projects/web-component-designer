//import { PointerActionType } from "../../../enums/PointerActionType";
import { IDesignItem } from "../../item/IDesignItem";
import { InstanceServiceContainer } from "../../services/InstanceServiceContainer";
import { IStringPosition } from "../../services/htmlWriterService/IStringPosition";
import { ServiceContainer } from "../../services/ServiceContainer";
import { Snaplines } from "./Snaplines";
import { IDesignerMousePoint } from "../../../interfaces/IDesignerMousePoint";
import { IPlacementView } from './IPlacementView';
import { IExtensionManager } from "./extensions/IExtensionManger";
import { IUiCommandHandler } from "../../../commandHandling/IUiCommandHandler";
import { IPoint } from "../../../interfaces/IPoint";

export interface IDesignerView extends IPlacementView, IUiCommandHandler {
  readonly serviceContainer: ServiceContainer;
  readonly instanceServiceContainer: InstanceServiceContainer;
  readonly containerBoundingRect: DOMRect;
  readonly rootDesignItem: IDesignItem;
  readonly overlayLayer: SVGElement;
  readonly extensionManager: IExtensionManager;

  readonly snapLines: Snaplines;

  readonly shadowRoot: ShadowRoot;

  readonly alignOnGrid: boolean;
  readonly alignOnSnap: boolean;

  initialize(serviceContainer: ServiceContainer);

  getDesignerMousepoint(event: MouseEvent, target: Element, startPoint?: IDesignerMousePoint): IDesignerMousePoint;
  getElementAtPoint(point: IPoint, ignoreElementCallback?: (element: HTMLElement) => boolean);
  elementFromPoint(x: number, y: number): Element;

  getHTML(designItemsAssignmentList?: Map<IDesignItem, IStringPosition>): string;
  parseHTML(html: string): void;
}