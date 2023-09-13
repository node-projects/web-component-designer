import { IDesignItem } from '../../item/IDesignItem.js';
import { OverlayLayerView } from './overlayLayerView.js';
import { Snaplines } from './Snaplines.js';

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