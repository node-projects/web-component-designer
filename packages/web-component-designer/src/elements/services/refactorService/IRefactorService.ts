import { IDesignItem } from "../../item/IDesignItem.js";
import { IRefactoring } from "./IRefactoring.js";

export interface IRefactorService {
    getRefactorings(designItems: IDesignItem[]): IRefactoring[];
    refactor(refactoring: IRefactoring, oldValue: string, newValue: string);
}