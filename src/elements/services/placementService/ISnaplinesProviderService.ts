import { IService } from "../IService";
import { IDesignItem } from "../../item/IDesignItem";

export interface ISnaplinesProviderService extends IService {
  provideSnaplines(containerItem: IDesignItem, ignoredItems: IDesignItem[]): {
    outerRect: DOMRect,
    positionsH: [number, DOMRect][],
    positionsMiddleH: [number, DOMRect][],
    positionsV: [number, DOMRect][],
    positionsMiddleV: [number, DOMRect][]
  };
}