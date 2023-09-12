import { IElementDefinition } from './IElementDefinition.js';

export interface IElementsJson {
    "imports"?: string[],
    "elements": (string | IElementDefinition)[]
}