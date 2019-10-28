import { UndoItemType } from "./UndoItemType";

export interface IUndoItem {
    action: UndoItemType,
    node: HTMLElement,
    detail: any
};