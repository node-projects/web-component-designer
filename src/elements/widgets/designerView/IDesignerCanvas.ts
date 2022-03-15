//import { PointerActionType } from "../../../enums/PointerActionType";
import { IDesignItem } from "../../item/IDesignItem";
import { InstanceServiceContainer } from "../../services/InstanceServiceContainer";
import { ServiceContainer } from "../../services/ServiceContainer";
import { Snaplines } from "./Snaplines";
import { IPlacementView } from './IPlacementView';
import { IExtensionManager } from "./extensions/IExtensionManger";
import { IUiCommandHandler } from "../../../commandHandling/IUiCommandHandler";
import { IPoint } from "../../../interfaces/IPoint";
import { OverlayLayerView } from "./overlayLayerView";
import { IRect } from "../../../interfaces/IRect.js";
import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { ISize } from "../../../interfaces/ISize.js";
import { ITool } from "./tools/ITool.js";

export interface IDesignerCanvas extends IPlacementView, IUiCommandHandler {
  readonly serviceContainer: ServiceContainer;
  readonly instanceServiceContainer: InstanceServiceContainer;
  readonly containerBoundingRect: DOMRect;
  readonly outerRect: DOMRect;
  readonly rootDesignItem: IDesignItem;
  readonly overlayLayer: OverlayLayerView;
  readonly extensionManager: IExtensionManager;
  readonly clickOverlay: HTMLDivElement;

  readonly snapLines: Snaplines;

  readonly shadowRoot: ShadowRoot;

  readonly alignOnGrid: boolean;
  readonly alignOnSnap: boolean;

  readonly onContentChanged: TypedEvent<void>;

  zoomFactor: number;
  readonly scaleFactor: number;
  canvasOffset: IPoint

  eatEvents: Element;

  initialize(serviceContainer: ServiceContainer);

  getNormalizedEventCoordinates(event: MouseEvent): IPoint;
  getViewportCoordinates(event: MouseEvent): IPoint;
  getNormalizedElementCoordinates(element: Element): IRect;

  captureActiveTool(tool: ITool);
  releaseActiveTool();

  getDesignSurfaceDimensions(): ISize;

  getNormalizedOffsetInElement(event: MouseEvent, element: Element): IPoint;
  getElementAtPoint(point: IPoint, ignoreElementCallback?: (element: HTMLElement) => boolean);
  elementFromPoint(x: number, y: number): Element;
  elementsFromPoint(x: number, y: number): Element[];

  getItemsBelowMouse(event: MouseEvent): Element[];

  zoomTowardsPoint(point: IPoint, scalechange: number): void;
  zoomPoint(canvasPoint: IPoint, newZoom: number): void;
  zoomOntoRectangle(startPoint: IPoint, endPoint: IPoint): void;

  showDesignItemContextMenu(designItem: IDesignItem, event: MouseEvent): void;
}