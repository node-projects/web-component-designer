import { IRect } from "../../../interfaces/IRect.js";
import { IDesignItem } from "../../item/IDesignItem.js";
import { InstanceServiceContainer } from "../InstanceServiceContainer.js";
import { ServiceContainer } from "../ServiceContainer.js";

export interface ICopyPasteService {
  copyItems(designItems: IDesignItem[]): Promise<void>
  /** Return detached paste items after applying the optional copyPreparationService. */
  getPasteItems(serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<[designItems: IDesignItem[], positions?: IRect[]]>
}