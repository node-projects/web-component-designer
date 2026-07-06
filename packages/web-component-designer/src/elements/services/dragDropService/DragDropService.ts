import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { DesignItem } from '../../item/DesignItem.js';
import { IDragDropService } from "./IDragDropService.js";
import { IDesignItem } from "../../item/IDesignItem.js";
import { IPlacementService } from "../placementService/IPlacementService.js";
import { IElementDefinition } from "../elementsService/IElementDefinition.js";
import { ExtensionType } from "../../widgets/designerView/extensions/ExtensionType.js";
import { dragDropFormatNameElementDefinition } from "../../../Constants.js";
import { NpmPackageLoader } from "../../helper/NpmPackageLoader.js";

interface IPlacementEnsureAncestor {
  selector: string;
  create?: {
    tag?: string;
    attributes?: Record<string, string>;
    styles?: Record<string, string>;
  };
  mode?: 'wrap';
}

export class DragDropService implements IDragDropService {
  private _dragOverExtensionItem: IDesignItem;
  private _oldX: number;
  private _oldY: number;
  private _currentDragDropFormatNameElementDefinition: string;

  constructor() {
    window.addEventListener("dragstart", (e) => {
      const dt = e.dataTransfer;
      if (!dt) return;
      const origSetData = dt.setData.bind(dt);
      dt.setData = (type, value) => {
        if (type == dragDropFormatNameElementDefinition)
          this._currentDragDropFormatNameElementDefinition = value;
        return origSetData(type, value);
      };
    }, true); // <-- use capture phase!
    window.addEventListener("dragend", (e) => {
      this._currentDragDropFormatNameElementDefinition = null;
    }, true); // <-- use capture phase!
  }

  public dragEnter(designerCanvas: IDesignerCanvas, event: DragEvent) {
  }

  public dragLeave(designerCanvas: IDesignerCanvas, event: DragEvent) {
    if (this._dragOverExtensionItem) {
      designerCanvas.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerExternalDragOverAndCanBeEntered);
      this._dragOverExtensionItem = null;
    }
  }

  public async dragOver(designerCanvas: IDesignerCanvas, event: DragEvent) {
    if (designerCanvas.readOnly) {
      event.dataTransfer.dropEffect = 'none';
      return;
    }
    let di: IDesignItem = null;
    let transferData = event.dataTransfer.getData(dragDropFormatNameElementDefinition);
    if (!transferData) {
      transferData = this._currentDragDropFormatNameElementDefinition;
    }
    if (transferData) {
      const elementDefinition = <IElementDefinition>JSON.parse(transferData);
      if (elementDefinition) {
        di = await designerCanvas.serviceContainer.forSomeServicesTillResult("instanceService", (service) => service.getElement(elementDefinition, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer));
      }
    }

    let [newContainer] = this.getPossibleContainerForDragDrop(designerCanvas, event, di ? [di] : null);
    if (!newContainer)
      newContainer = designerCanvas.rootDesignItem;

    if (this._dragOverExtensionItem != newContainer) {
      designerCanvas.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerExternalDragOverAndCanBeEntered);
      designerCanvas.extensionManager.applyExtension(newContainer, ExtensionType.ContainerExternalDragOverAndCanBeEntered, event);
      this._dragOverExtensionItem = newContainer;
    } else {
      if (event.x != this._oldX && event.y != this._oldY) {
        this._oldX = event.x;
        this._oldY = event.y;
        designerCanvas.extensionManager.refreshExtension(newContainer, ExtensionType.ContainerExternalDragOverAndCanBeEntered, event);
      }
    }
  }

  public async drop(designerCanvas: IDesignerCanvas, event: DragEvent) {
    if (this._dragOverExtensionItem) {
      designerCanvas.extensionManager.removeExtension(this._dragOverExtensionItem, ExtensionType.ContainerExternalDragOverAndCanBeEntered);
      this._dragOverExtensionItem = null;
    }

    const transferData = event.dataTransfer.getData(dragDropFormatNameElementDefinition);
    const elementDefinition = <IElementDefinition>JSON.parse(transferData);
    const di = await designerCanvas.serviceContainer.forSomeServicesTillResult("instanceService", (service) => service.getElement(elementDefinition, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer));

    let [newContainer] = this.getPossibleContainerForDragDrop(designerCanvas, event, [di]);
    if (!newContainer)
      newContainer = designerCanvas.rootDesignItem;

    const grp = di.openGroup("Insert of &lt;" + di.name + "&gt;");
    const placement = this.applyPlacementRules(designerCanvas, newContainer, di, elementDefinition);
    newContainer = placement.container;
    const placedItem = placement.placedItem;

    const containerService = designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(newContainer, newContainer.getComputedStyle(), placedItem))
    containerService.enterContainer(newContainer, [placedItem], 'drop');

    const containerPos = designerCanvas.getNormalizedElementCoordinates(newContainer.element);
    const evCoord = designerCanvas.getNormalizedEventCoordinates(event);
    const pos = { x: evCoord.x - containerPos.x, y: evCoord.y - containerPos.y };

    let offset = { x: 0, y: 0 };
    if (elementDefinition.mouseOffset)
      offset = elementDefinition.mouseOffset;
    containerService.place(event, designerCanvas, newContainer, offset, { x: 0, y: 0 }, pos, [placedItem]);
    containerService.finishPlace(event, designerCanvas, newContainer, offset, { x: 0, y: 0 }, pos, [placedItem]);
    requestAnimationFrame(() => {
      designerCanvas.instanceServiceContainer.selectionService.setSelectedElements([di], event);
      grp.commit();
    });
  }

  private applyPlacementRules(designerCanvas: IDesignerCanvas, container: IDesignItem, item: IDesignItem, elementDefinition: IElementDefinition): { container: IDesignItem, placedItem: IDesignItem } {
    const packageHack = elementDefinition.packageName ? NpmPackageLoader.getPackageHack(elementDefinition.packageName) : null;
    const rules: IPlacementEnsureAncestor[] = packageHack?.placement?.ensureAncestors;
    if (!rules?.length)
      return { container, placedItem: item };

    let placedItem = item;
    for (const rule of rules) {
      if (rule.mode !== 'wrap' || !rule.selector || this.hasAncestorMatching(container, rule.selector))
        continue;

      const wrapper = this.createWrapperDesignItem(designerCanvas, rule);
      if (!wrapper)
        continue;

      container.insertChild(wrapper);
      container = wrapper;
    }
    return { container, placedItem };
  }

  private hasAncestorMatching(container: IDesignItem, selector: string): boolean {
    let current = container;
    while (current) {
      try {
        if (current.element?.matches(selector))
          return true;
      } catch (err) {
        console.warn('invalid placement ancestor selector: ', selector, err);
        return false;
      }
      current = current.parent;
    }
    return false;
  }

  private createWrapperDesignItem(designerCanvas: IDesignerCanvas, rule: IPlacementEnsureAncestor): IDesignItem {
    if (!rule.create?.tag)
      return null;

    const wrapperElement = designerCanvas.rootDesignItem.document.createElement(rule.create.tag);
    if (rule.create.attributes) {
      for (const name in rule.create.attributes) {
        wrapperElement.setAttribute(name, rule.create.attributes[name]);
      }
    }
    if (rule.create.styles) {
      for (const name in rule.create.styles) {
        wrapperElement.style[name] = rule.create.styles[name];
      }
    }
    return DesignItem.createDesignItemFromInstance(wrapperElement, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
  }

  public getPossibleContainerForDragDrop(designerCanvas: IDesignerCanvas, event: DragEvent, designItems?: IDesignItem[]): [newContainerElementDesignItem: IDesignItem, newContainerService: IPlacementService] {
    let newContainerElementDesignItem: IDesignItem = null;
    let newContainerService: IPlacementService = null;

    const elementsFromPoint = designerCanvas.elementsFromPoint(event.clientX, event.clientY);
    for (let e of elementsFromPoint) {
      if (e == designerCanvas.rootDesignItem.element) {
        newContainerElementDesignItem = designerCanvas.rootDesignItem;
        const containerStyle = getComputedStyle(newContainerElementDesignItem.element);
        newContainerService = designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(newContainerElementDesignItem, containerStyle));
        break;
      } else if (false) {
        //check we don't try to move a item over one of its children..
      } else {
        newContainerElementDesignItem = DesignItem.GetOrCreateDesignItem(e, e, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
        const containerStyle = getComputedStyle(newContainerElementDesignItem.element);
        newContainerService = designerCanvas.serviceContainer.getLastServiceWhere('containerService', x => x.serviceForContainer(newContainerElementDesignItem, containerStyle));
        if (newContainerService) {
          //TODO: Maybe the check for SVG Element should be in "canEnterByDrop"?
          if (designItems && newContainerService.canEnter(newContainerElementDesignItem, designItems) && !(newContainerElementDesignItem.element instanceof newContainerElementDesignItem.window.SVGElement)) {
            break;
          } else if (!designItems && newContainerService.isEnterableContainer(newContainerElementDesignItem) && !(newContainerElementDesignItem.element instanceof newContainerElementDesignItem.window.SVGElement)) {
            break;
          } else {
            newContainerElementDesignItem = null;
            newContainerService = null;
            continue;
          }
        }
      }
    }
    return [newContainerElementDesignItem, newContainerService];
  }
}
