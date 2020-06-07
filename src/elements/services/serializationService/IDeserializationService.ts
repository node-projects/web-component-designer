import { IDesignItem } from '../../item/IDesignItem';
import { IDeserializationOptions } from './IDeserializationOptions';

export interface IDeserializationService {
  deserialize(code : string, options: IDeserializationOptions) : IDesignItem;
}