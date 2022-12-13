import { CommandType } from '../commandHandling/CommandType.js';

export interface ICommandHandler {
    executeCommand(type: CommandType, parameter: any): Promise<void>;
    canExecuteCommand(type: CommandType, parameter: any): boolean;
}