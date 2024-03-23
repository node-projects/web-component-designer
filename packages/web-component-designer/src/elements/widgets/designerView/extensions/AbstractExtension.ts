import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { AbstractExtensionBase } from "./AbstractExtensionBase.js";
import { OverlayLayer } from './OverlayLayer.js';
import { IPoint } from '../../../../interfaces/IPoint.js';

export type toolbarObject = SVGForeignObjectElement &
{
  updatePosition: (position: IPoint) => void,
  getById: <T>(id: string) => T
}

export abstract class AbstractExtension extends AbstractExtensionBase implements IDesignerExtension {
  protected extendedItem: IDesignItem;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView)
    this.extendedItem = extendedItem;
  }

  abstract extend(cache: Record<string | symbol, any>, event?: Event);
  abstract refresh(cache: Record<string | symbol, any>, event?: Event);
  abstract dispose();

  remove() {
    this.extensionManager.removeExtensionInstance(this.extendedItem, this);
  }

  createToolbar(template: HTMLTemplateElement, width: number, height: number, overlayLayer: OverlayLayer = OverlayLayer.Foreground) {
    const element = <SVGGraphicsElement & {}>(<any>template.content.cloneNode(true));
    element.querySelectorAll('*').forEach(x => (<HTMLElement>x).onpointerdown = (e) => {
      this.designerCanvas.ignoreEvent(e);
    });

    const foreignObject = <toolbarObject><any>document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    foreignObject.classList.add('svg-toolbar-container');
    foreignObject.setAttribute('width', '' + width);
    foreignObject.setAttribute('height', '' + height);
    foreignObject.appendChild(element)
    this._addOverlay(foreignObject, overlayLayer);

    foreignObject.updatePosition = (position: IPoint) => {
      foreignObject.setAttribute('x', '' + position.x);
      foreignObject.setAttribute('y', '' + position.y);
    }
    foreignObject.getById = <T>(id: string) => {
      return <T>foreignObject.querySelector('#' + id);
    }
    return foreignObject;
  }
}