//import { PointerActionType } from '../../../enums/PointerActionType.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { InstanceServiceContainer } from '../../services/InstanceServiceContainer.js';
import { ServiceContainer } from '../../services/ServiceContainer.js';
import { Snaplines } from './Snaplines.js';
import { IPlacementView } from './IPlacementView.js';
import { IExtensionManager } from './extensions/IExtensionManger.js';
import { IUiCommandHandler } from '../../../commandHandling/IUiCommandHandler.js';
import { IPoint } from '../../../interfaces/IPoint.js';
import { OverlayLayerView } from './overlayLayerView.js';
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

  readonly shadowRoot: ShadowRoot | null;

  readonly alignOnGrid: boolean;
  readonly alignOnSnap: boolean;

  readonly onContentChanged: TypedEvent<void>;

  zoomFactor: number;
  designerOffsetWidth: number;
  designerOffsetHeight: number;
  readonly scaleFactor: number;
  canvasOffset: IPoint;
  readonly containerOffset: IPoint;
  canvas: HTMLElement;
  additionalStyles: CSSStyleSheet[];

  ignoreEvent(event: Event);
  
  initialize(serviceContainer: ServiceContainer);

  getNormalizedEventCoordinates(event: MouseEvent): IPoint;
  getViewportCoordinates(event: MouseEvent): IPoint;
  getNormalizedElementCoordinates(element: Element): IRect;
  getNormalizedElementCoordinatesAndRealSizes(element: Element): IRect & { realWidth: number, realHeight: number }
  getNormalizedElementCoordinates(element: Element, ignoreScalefactor?: boolean): IRect;

  captureActiveTool(tool: ITool);
  releaseActiveTool();

  getDesignSurfaceDimensions(): ISize;

  getNormalizedOffsetInElement(event: MouseEvent, element: Element): IPoint;
  getElementAtPoint(point: IPoint, ignoreElementCallback?: (element: HTMLElement) => boolean);
  elementsFromPoint(x: number, y: number): Element[];

  showHoverExtension(element: Element, event: Event);

  setDesignItems(designItems: IDesignItem[]);
  _internalSetDesignItems(designItems: IDesignItem[]);

  zoomTowardsPoint(point: IPoint, scalechange: number): void;
  zoomPoint(canvasPoint: IPoint, newZoom: number): void;
  zoomOntoRectangle(startPoint: IPoint, endPoint: IPoint): void;

  showDesignItemContextMenu(designItem: IDesignItem, event: MouseEvent): void;

  lazyTriggerReparseDocumentStylesheets();
}