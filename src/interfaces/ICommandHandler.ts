import { CommandType } from "../commandHandling/CommandType";

export interface ICommandHandler {
    executeCommand(type: CommandType, parameter: any): Promise<void>;
    canExecuteCommand(type: CommandType, parameter: any): boolean;
}