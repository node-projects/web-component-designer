import { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerExtension } from '../IDesignerExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { UnifiedGeometryExtension } from './UnifiedGeometryExtension.js';
import { isVisualSvgElement } from '../../../../helper/SvgHelper.js';
import { IGeometryReader } from './geometry/IGeometry.js';
import { css } from '@node-projects/base-custom-webcomponent';

export class UnifiedGeometryExtensionProvider implements IDesignerExtensionProvider {

  private _customReader?: IGeometryReader;

  constructor(customReader?: IGeometryReader) {
    this._customReader = customReader;
  }

  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (this._customReader) return true;

    const node = designItem.node;
    if (node instanceof SVGPathElement ||
      node instanceof SVGRectElement ||
      node instanceof SVGLineElement ||
      node instanceof SVGEllipseElement ||
      node instanceof SVGCircleElement ||
      node instanceof SVGPolygonElement ||
      node instanceof SVGPolylineElement) {
      return isVisualSvgElement(node);
    }
    return false;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new UnifiedGeometryExtension(extensionManager, designerView, designItem, this._customReader);
  }

  readonly style = css`
    .svg-control-line {
      stroke: #3899ec;
      fill: none;
      stroke-dasharray: 4;
      pointer-events: none;
      opacity: 0.9;
    }

    .svg-control-point {
      stroke: #3899ec;
      fill: white;
      pointer-events: auto;
    }
  `;
}
