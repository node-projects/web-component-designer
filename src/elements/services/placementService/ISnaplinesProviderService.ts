import { IService } from "../IService";
import { IDesignItem } from "../../item/IDesignItem";
import { IRect } from "../../../interfaces/IRect.js";

export interface ISnaplinesProviderService extends IService {
  provideSnaplines(containerItem: IDesignItem, ignoredItems: IDesignItem[]): {
    outerRect: DOMRect,
    positionsH: [number, IRect][],
    positionsMiddleH: [number, IRect][],
    positionsV: [number, IRect][],
    positionsMiddleV: [number, IRect][]
  };
}