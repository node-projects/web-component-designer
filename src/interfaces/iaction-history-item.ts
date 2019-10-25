import { ActionHistoryType } from "../enums/ActionHistoryType";

export interface IActionHistoyItem {
    action: ActionHistoryType,
    node: HTMLElement,
    detail: any
};