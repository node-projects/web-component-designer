import { OverlayLayer, DesignItem, IBindableObject, IBindableObjectDragDropService, IDesignerCanvas, InsertAction, ChangeGroup, BindingTarget, IProperty, IDesignItem, PropertyType } from "@node-projects/web-component-designer";
import { BindingsHelper } from "../helpers/BindingsHelper.js";
import { VisualizationHandler } from "../interfaces/VisualizationHandler.js";
import { VisualizationBinding } from "../interfaces/VisualizationBinding.js";

export class BindableObjectDragDropService implements IBindableObjectDragDropService {
  constructor(bindingsHelper: BindingsHelper, visualizationHandler: VisualizationHandler) {
    this._bindingsHelper = bindingsHelper;
    this._visualizationHandler = visualizationHandler;
  }

  private _bindingsHelper: BindingsHelper;
  private _visualizationHandler: VisualizationHandler

  rectMap = new Map<Element, SVGRectElement>();
  rect: SVGRectElement;

  dragEnter(designerCanvas: IDesignerCanvas, event: DragEvent, element: Element) {
    const designItem = DesignItem.GetDesignItem(element);
    if (designItem && !designItem.isRootItem) {
      let itemRect = designerCanvas.getNormalizedElementCoordinates(element);
      this.rect = designerCanvas.overlayLayer.drawRect('IobrokerWebuiBindableObjectDragDropService', itemRect.x, itemRect.y, itemRect.width, itemRect.height, '', null, OverlayLayer.Background);
      this.rect.style.fill = '#ff0000';
      this.rect.style.opacity = '0.3';
      this.rectMap.set(element, this.rect);
    }
  }

  dragLeave(designerCanvas: IDesignerCanvas, event: DragEvent, element: Element) {
    const designItem = DesignItem.GetDesignItem(element);
    if (designItem && !designItem.isRootItem) {
      const rect = this.rectMap.get(element);
      designerCanvas.overlayLayer.removeOverlay(rect);
      this.rectMap.delete(element);
    }
  }

  dragOver(designerView: IDesignerCanvas, event: DragEvent, element: Element): "none" | "copy" | "link" | "move" {
    return 'copy';
  }

  async drop(designerCanvas: IDesignerCanvas, event: DragEvent, bindableObject: IBindableObject<any>, element: Element) {
    for (let r of this.rectMap.values()) {
      designerCanvas.overlayLayer.removeOverlay(r);
    }
    this.rectMap.clear();

    const designItem = DesignItem.GetDesignItem(element);
    const obj = await this._visualizationHandler.getObject(bindableObject.fullName);
    const info = this._visualizationHandler.getSignalInformation(obj);

    if (designItem && !designItem.isRootItem) {
      // Add binding to drop target...
      if (element instanceof HTMLInputElement) {
        const binding: VisualizationBinding = { signal: bindableObject.fullName, target: BindingTarget.property };
        const serializedBinding = this._bindingsHelper.serializeBinding(element, element.type == 'checkbox' ? 'checked' : 'value', binding);
        designItem.setAttribute(serializedBinding[0], serializedBinding[1]);
      } else {
        const binding = { signal: bindableObject.fullName, target: BindingTarget.content };
        const serializedBinding = this._bindingsHelper.serializeBinding(element, null, binding);
        designItem.setAttribute(serializedBinding[0], serializedBinding[1]);
      }
    } else {
      const position = designerCanvas.getNormalizedEventCoordinates(event);

      let di: DesignItem;
      let grp: ChangeGroup;

      let state = await this._visualizationHandler.getState(bindableObject.fullName);
      //TODO: only icon&image if val is a url with extension 
      if (info.role === 'url' && typeof state?.val === 'string') {
        if (state.val.endsWith('jpg') || state.val.endsWith('jpeg') || state.val.endsWith('png') || state.val.endsWith('gif') || state.val.endsWith('svg')) {
          const img = document.createElement('img');
          di = DesignItem.createDesignItemFromInstance(img, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
          grp = di.openGroup("Insert");
          const binding: VisualizationBinding = { signal: bindableObject.fullName, target: BindingTarget.property };
          let serializedBinding = this._bindingsHelper.serializeBinding(img, 'src', binding);
          di.setAttribute(serializedBinding[0], serializedBinding[1]);
          (<HTMLImageElement>di.element).src = state.val;
        } else if (state.val.endsWith('mp4')) {
          const video = document.createElement('video');
          di = DesignItem.createDesignItemFromInstance(video, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
          grp = di.openGroup("Insert");
          const binding: VisualizationBinding = { signal: bindableObject.fullName, target: BindingTarget.property };
          let serializedBinding = this._bindingsHelper.serializeBinding(video, 'src', binding);
          di.setAttribute(serializedBinding[0], serializedBinding[1]);
          (<HTMLImageElement>di.element).src = state.val;
        } else {
          const video = document.createElement('iframe');
          di = DesignItem.createDesignItemFromInstance(video, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
          grp = di.openGroup("Insert");
          const binding: VisualizationBinding = { signal: bindableObject.fullName, target: BindingTarget.property };
          let serializedBinding = this._bindingsHelper.serializeBinding(video, 'src', binding);
          di.setAttribute(serializedBinding[0], serializedBinding[1]);
          (<HTMLImageElement>di.element).src = state.val;
        }
      }

      if (!di) {
        const input = document.createElement('input');
        di = DesignItem.createDesignItemFromInstance(input, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
        grp = di.openGroup("Insert");
        let twoWay = info.writeable !== false;
        const binding: VisualizationBinding = { signal: bindableObject.fullName, target: BindingTarget.property, twoWay: twoWay };
        let serializedBinding = this._bindingsHelper.serializeBinding(input, 'value', binding);

        if (info.type === 'boolean') {
          serializedBinding = this._bindingsHelper.serializeBinding(input, 'checked', binding);
          di.setAttribute("type", "checkbox");
        } else if (info.role == 'date') {
          binding.twoWay = twoWay;
          serializedBinding = this._bindingsHelper.serializeBinding(input, 'value-as-number', binding);
          di.setAttribute("type", "date");
          di.setAttribute("readonly", "");
        } else if (info.role == 'datetime') {
          binding.twoWay = twoWay;
          serializedBinding = this._bindingsHelper.serializeBinding(input, 'value-as-number', binding);
          di.setAttribute("type", "datetime-local");
          di.setAttribute("readonly", "");
        }
        di.setAttribute(serializedBinding[0], serializedBinding[1]);
      }
      di.setStyle('position', 'absolute');
      di.setStyle('left', position.x + 'px');
      di.setStyle('top', position.y + 'px');
      designerCanvas.instanceServiceContainer.undoService.execute(new InsertAction(designerCanvas.rootDesignItem, designerCanvas.rootDesignItem.childCount, di));
      grp.commit();
      requestAnimationFrame(() => designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([di]));
    }
  }

  dragOverOnProperty?(event: DragEvent, property: IProperty, designItems: IDesignItem[]): 'none' | 'copy' | 'link' | 'move' {
    return 'copy';
  }

  dropOnProperty?(event: DragEvent, property: IProperty, bindableObject: IBindableObject<any>, designItems: IDesignItem[]) {
    if (property.type == 'signal') {
      property.service.setValue(designItems, property, bindableObject.fullName);
      return;
    }
    const binding: VisualizationBinding = { signal: bindableObject.fullName, target: BindingTarget.property };
    if (property.propertyType == PropertyType.attribute)
      binding.target = BindingTarget.attribute;
    if (property.propertyType == PropertyType.cssValue)
      binding.target = BindingTarget.css;
    binding.signal = bindableObject.fullName;
    binding.twoWay = property.propertyType == PropertyType.property || property.propertyType == PropertyType.propertyAndAttribute;
    //if (designItems[0].element instanceof BaseCustomControl)
    //    binding.twoWay = false;
    const group = designItems[0].openGroup('drop binding')
    for (let d of designItems) {
      const serializedBinding = this._bindingsHelper.serializeBinding(d.element, property.name, binding);
      d.setAttribute(serializedBinding[0], serializedBinding[1]);
    }
    group.commit();
  }
}