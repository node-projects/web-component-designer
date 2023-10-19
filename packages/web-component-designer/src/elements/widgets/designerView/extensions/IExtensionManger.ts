import { IDesignItem } from '../../../item/IDesignItem.js';
import { ExtensionType } from './ExtensionType.js';
import { IDesignerExtension } from './IDesignerExtension.js';

export interface IExtensionManager {
  applyExtension(designItem: IDesignItem, extensionType: ExtensionType, event?: Event, recursive?: boolean) : IDesignerExtension[];
  applyExtensions(designItems: IDesignItem[], extensionType: ExtensionType, event?: Event, recursive?: boolean);
  removeExtension(designItem: IDesignItem, extensionType?: ExtensionType);
  removeExtensions(designItems: IDesignItem[], recursive: boolean, extensionType?: ExtensionType);
  refreshExtension(designItem: IDesignItem, extensionType?: ExtensionType, event?: Event);
  refreshExtensions(designItems: IDesignItem[], extensionType?: ExtensionType, event?: Event, ignoredExtension?: IDesignerExtension, timeout?: number);
  refreshAllExtensions(designItems: IDesignItem[], ignoredExtension?: IDesignerExtension);
  refreshAllAppliedExtentions();
  reapplyAllAppliedExtentions();
}
