import { IDesignItem } from '../../../item/IDesignItem.js';
import { ExtensionType } from './ExtensionType.js';
import { IDesignerExtension } from './IDesignerExtension.js';

export interface IExtensionManager {
  applyExtension(designItem: IDesignItem, extensionType: ExtensionType, recursive?: boolean) : IDesignerExtension[];
  applyExtensions(designItems: IDesignItem[], extensionType: ExtensionType, recursive?: boolean);
  removeExtension(designItem: IDesignItem, extensionType?: ExtensionType);
  removeExtensions(designItems: IDesignItem[], includeChildren: boolean, extensionType?: ExtensionType);
  refreshExtension(designItem: IDesignItem, extensionType?: ExtensionType);
  refreshExtensions(designItems: IDesignItem[], extensionType?: ExtensionType);
  refreshAllExtensions(designItems: IDesignItem[], ignoredExtension?: any);
  refreshAllAppliedExtentions();
  reapplyAllAppliedExtentions();
}
