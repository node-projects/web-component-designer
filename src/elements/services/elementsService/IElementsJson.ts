import { IElementDefinition } from './IElementDefinition';

export interface IElementsJson {
    "imports"?: string[],
    "elements": (string | IElementDefinition)[]
}