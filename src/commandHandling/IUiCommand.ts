import { CommandType } from "./CommandType";

export interface IUiCommand {
    type: CommandType;
    special?: string;
    parameter?: any;

    altKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
}
