import { CommandType } from './CommandType.js';

export interface IUiCommand {
    type: CommandType;
    event?: Event;
    special?: string;
    parameter?: any;

    altKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
}
