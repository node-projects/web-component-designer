import { IUiCommand } from './IUiCommand';

export interface IUiCommandHandler {
    executeCommand: (command: IUiCommand) => void;
    canExecuteCommand: (command: IUiCommand) => boolean;
}
