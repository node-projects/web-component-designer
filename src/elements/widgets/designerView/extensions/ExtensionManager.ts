import { IDesignItem } from "../../../item/IDesignItem";
import { IDesignerView } from "../IDesignerView";
import { ExtensionType } from './ExtensionType';

export class ExtensionManager {
  designerView: IDesignerView;
  constructor(designerView: IDesignerView) {
    this.designerView = designerView;
  }

  applyExtension(designItem: IDesignItem, extensionType: ExtensionType) {
    const extProv = this.designerView.serviceContainer.designerExtensions.get(extensionType);
    if (extProv) {
      for (let e of extProv) {
        if (e.shouldExtend(designItem)) {
          let appE = designItem.appliedDesignerExtensions.get(extensionType);
          if (!appE)
            appE = [];
          const ext = e.getExtension(this.designerView, designItem);
          ext.extend();
          appE.push(ext);
          designItem.appliedDesignerExtensions.set(extensionType, appE);
        }
      }
    }
  }

  applyExtensions(designItems: IDesignItem[], extensionType: ExtensionType) {
    const extProv = this.designerView.serviceContainer.designerExtensions.get(extensionType);
    if (extProv) {
      for (let e of extProv) {
        for (let i of designItems) {
          if (e.shouldExtend(i)) {
            let appE = i.appliedDesignerExtensions.get(extensionType);
            if (!appE)
              appE = [];
            const ext = e.getExtension(this.designerView, i);
            ext.extend();
            appE.push(ext);
            i.appliedDesignerExtensions.set(extensionType, appE);
          }
        }
      }
    }
  }

  removeExtension(designItem: IDesignItem, extensionType?: ExtensionType) {
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

  removeExtensions(designItems: IDesignItem[], extensionType: ExtensionType) {
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

  refreshExtension(designItem: IDesignItem, extensionType?: ExtensionType) {
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

  refreshExtensions(designItems: IDesignItem[], extensionType?: ExtensionType) {
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
