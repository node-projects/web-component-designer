import { DesignItem } from "../../../item/DesignItem";
import { IDesignItem } from "../../../item/IDesignItem";
import { ISelectionChangedEvent } from "../../../services/selectionService/ISelectionChangedEvent";
import { IDesignerView } from "../IDesignerView";
import { ExtensionType } from './ExtensionType';
import { IExtensionManager } from "./IExtensionManger";

export class ExtensionManager implements IExtensionManager {

  designerView: IDesignerView;

  constructor(designerView: IDesignerView) {
    this.designerView = designerView;

    designerView.instanceServiceContainer.selectionService.onSelectionChanged.on(this._selectedElementsChanged.bind(this));

    //TODO: Create Permanent Extensions. We need a Event for new DesignItem Added and Removed from DOM
  }

  private _selectedElementsChanged(selectionChangedEvent: ISelectionChangedEvent) {
    if (selectionChangedEvent.oldSelectedElements && selectionChangedEvent.oldSelectedElements.length) {
      const primaryContainer = DesignItem.GetOrCreateDesignItem(selectionChangedEvent.oldSelectedElements[0].parent.element, this.designerView.serviceContainer, this.designerView.instanceServiceContainer)
      this.removeExtension(primaryContainer, ExtensionType.PrimarySelectionContainer);
      this.removeExtension(selectionChangedEvent.oldSelectedElements[0], ExtensionType.PrimarySelection);
      this.removeExtensions(selectionChangedEvent.oldSelectedElements, ExtensionType.Selection);
    }
    if (selectionChangedEvent.selectedElements && selectionChangedEvent.selectedElements.length) {
      this.applyExtensions(selectionChangedEvent.selectedElements, ExtensionType.Selection);
      this.applyExtension(selectionChangedEvent.selectedElements[0], ExtensionType.PrimarySelection);
      const primaryContainer = DesignItem.GetOrCreateDesignItem(selectionChangedEvent.selectedElements[0].parent.element, this.designerView.serviceContainer, this.designerView.instanceServiceContainer)
      this.applyExtension(primaryContainer, ExtensionType.PrimarySelectionContainer);
    }

    this.refreshExtensions(selectionChangedEvent.selectedElements);
  }

  applyExtension(designItem: IDesignItem, extensionType: ExtensionType) {
    if (designItem) {
      const extProv = this.designerView.serviceContainer.designerExtensions.get(extensionType);
      if (extProv) {
        for (let e of extProv) {
          if (e.shouldExtend(this, this.designerView, designItem)) {
            let appE = designItem.appliedDesignerExtensions.get(extensionType);
            if (!appE)
              appE = [];
            const ext = e.getExtension(this, this.designerView, designItem);
            ext.extend();
            appE.push(ext);
            designItem.appliedDesignerExtensions.set(extensionType, appE);
          }
        }
      }
    }
  }

  applyExtensions(designItems: IDesignItem[], extensionType: ExtensionType) {
    if (designItems) {
      const extProv = this.designerView.serviceContainer.designerExtensions.get(extensionType);
      if (extProv) {
        for (let e of extProv) {
          for (let i of designItems) {
            if (e.shouldExtend(this, this.designerView, i)) {
              let appE = i.appliedDesignerExtensions.get(extensionType);
              if (!appE)
                appE = [];
              const ext = e.getExtension(this, this.designerView, i);
              ext.extend();
              appE.push(ext);
              i.appliedDesignerExtensions.set(extensionType, appE);
            }
          }
        }
      }
    }
  }

  removeExtension(designItem: IDesignItem, extensionType?: ExtensionType) {
    if (designItem) {
      if (extensionType) {
        let exts = designItem.appliedDesignerExtensions.get(extensionType);
        if (exts) {
          for (let e of exts) {
            e.dispose();
          }
          designItem.appliedDesignerExtensions.delete(extensionType);
        }
      } else {
        for (let appE of designItem.appliedDesignerExtensions) {
          for (let e of appE[1]) {
            e.dispose();
          }
        }
        designItem.appliedDesignerExtensions.clear();
      }
    }
  }

  removeExtensions(designItems: IDesignItem[], extensionType: ExtensionType) {
    if (designItems) {
      if (extensionType) {
        for (let i of designItems) {
          let exts = i.appliedDesignerExtensions.get(extensionType);
          if (exts) {
            for (let e of exts) {
              e.dispose();
            }
            i.appliedDesignerExtensions.delete(extensionType);
          }
        }
      } else {
        for (let i of designItems) {
          for (let appE of i.appliedDesignerExtensions) {
            for (let e of appE[1]) {
              e.refresh();
            }
          }
          i.appliedDesignerExtensions.clear();
        }
      }
    }
  }

  refreshExtension(designItem: IDesignItem, extensionType?: ExtensionType) {
    if (designItem) {
      if (extensionType) {
        let exts = designItem.appliedDesignerExtensions.get(extensionType);
        if (exts) {
          for (let e of exts) {
            e.refresh();
          }
        }
      } else {
        for (let appE of designItem.appliedDesignerExtensions) {
          for (let e of appE[1]) {
            e.refresh();
          }
        }
      }
    }
  }

  refreshExtensions(designItems: IDesignItem[], extensionType?: ExtensionType) {
    if (designItems) {
      if (extensionType) {
        for (let i of designItems) {
          let exts = i.appliedDesignerExtensions.get(extensionType);
          if (exts) {
            for (let e of exts) {
              e.refresh();
            }
          }
        }
      } else {
        for (let i of designItems) {
          for (let appE of i.appliedDesignerExtensions) {
            for (let e of appE[1]) {
              e.refresh();
            }
          }
        }
      }
    }
  }
}
