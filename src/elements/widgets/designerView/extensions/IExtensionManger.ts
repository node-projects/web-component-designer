import { IDesignItem } from "../../../item/IDesignItem";
import { ExtensionType } from './ExtensionType';

export interface IExtensionManager {
  applyExtension(designItem: IDesignItem, extensionType: ExtensionType, recursive?: boolean);
  applyExtensions(designItems: IDesignItem[], extensionType: ExtensionType, recursive?: boolean);
  removeExtension(designItem: IDesignItem, extensionType?: ExtensionType);
  removeExtensions(designItems: IDesignItem[], extensionType?: ExtensionType);
  refreshExtension(designItem: IDesignItem, extensionType?: ExtensionType);
  refreshExtensions(designItems: IDesignItem[], extensionType?: ExtensionType);
  refreshAllExtensions(designItems: IDesignItem[]);
  refreshAllAppliedExtentions();
}
