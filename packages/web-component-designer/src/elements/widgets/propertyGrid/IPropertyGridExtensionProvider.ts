import type { IProperty } from '../../services/propertiesService/IProperty.js';
import type { IDesignItem } from '../../item/IDesignItem.js';
import type { IContextMenuItem } from '../../helper/contextMenu/IContextMenuItem.js';

/** Optional content below a property row, contributed by an addon. */
export interface IPropertyGridExtension {
  element: HTMLElement;
  refresh(items: IDesignItem[]): void;
  getContextMenuItems?(items: IDesignItem[]): IContextMenuItem[];
  dispose?(): void;
}
export interface IPropertyGridExtensionProvider {
  createExtension(property: IProperty): IPropertyGridExtension | undefined;
}
