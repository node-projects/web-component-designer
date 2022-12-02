import { IDesignItem } from "../../item/IDesignItem";
import { OverlayLayerView } from "./overlayLayerView";
import { Snaplines } from './Snaplines';

export interface IPlacementView {
  alignOnSnap: boolean;
  alignOnGrid: boolean;
  gridSize: number;
  rootDesignItem: IDesignItem;
  overlayLayer: OverlayLayerView;
  snapLines: Snaplines;

  readonly zoomFactor: number;
  readonly scaleFactor: number;
}