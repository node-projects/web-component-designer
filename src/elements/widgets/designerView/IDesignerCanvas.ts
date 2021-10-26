//import { PointerActionType } from "../../../enums/PointerActionType";
import { IDesignItem } from "../../item/IDesignItem";
import { InstanceServiceContainer } from "../../services/InstanceServiceContainer";
import { ServiceContainer } from "../../services/ServiceContainer";
import { Snaplines } from "./Snaplines";
import { IDesignerMousePoint } from "../../../interfaces/IDesignerMousePoint";
import { IPlacementView } from './IPlacementView';
import { IExtensionManager } from "./extensions/IExtensionManger";
import { IUiCommandHandler } from "../../../commandHandling/IUiCommandHandler";
import { IPoint } from "../../../interfaces/IPoint";
import { OverlayLayerView } from "./overlayLayerView";

export interface IDesignerCanvas extends IPlacementView, IUiCommandHandler {
  readonly serviceContainer: ServiceContainer;
  readonly instanceServiceContainer: InstanceServiceContainer;
  readonly containerBoundingRect: DOMRect;
  readonly rootDesignItem: IDesignItem;
  readonly overlayLayer: OverlayLayerView;
  readonly extensionManager: IExtensionManager;

  readonly snapLines: Snaplines;

  readonly shadowRoot: ShadowRoot;

  readonly alignOnGrid: boolean;
  readonly alignOnSnap: boolean;

  eatEvents: Element;

  initialize(serviceContainer: ServiceContainer);

  getDesignerMousepoint(event: MouseEvent, target: Element, startPoint?: IDesignerMousePoint): IDesignerMousePoint;
  getElementAtPoint(point: IPoint, ignoreElementCallback?: (element: HTMLElement) => boolean);
  elementFromPoint(x: number, y: number): Element;
}