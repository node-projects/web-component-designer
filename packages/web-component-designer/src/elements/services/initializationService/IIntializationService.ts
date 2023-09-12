import { IDesignItem } from '../../item/IDesignItem.js';

// This is called for every root DesignItem added to the designer canvas. It's not called for the items children.
export interface IIntializationService {
  init(designItem: IDesignItem): void;
}