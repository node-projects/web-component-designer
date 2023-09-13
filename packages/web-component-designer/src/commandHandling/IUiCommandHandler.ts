import { IUiCommand } from './IUiCommand.js';

export interface IUiCommandHandler {
    executeCommand: (command: IUiCommand) => void;
    canExecuteCommand: (command: IUiCommand) => boolean;
}
