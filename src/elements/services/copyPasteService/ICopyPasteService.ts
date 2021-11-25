import { IDesignItem } from "../../item/IDesignItem.js";
import { InstanceServiceContainer } from "../InstanceServiceContainer.js";
import { ServiceContainer } from "../ServiceContainer.js";

export interface ICopyPasteService {
  copyItems(designItems: IDesignItem[]): Promise<void>
  getPasteItems(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<IDesignItem[]>
}