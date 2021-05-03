import { IDesignItem } from '../../item/IDesignItem';

export interface IIntializationService {
  init(designItem: IDesignItem): void;
}