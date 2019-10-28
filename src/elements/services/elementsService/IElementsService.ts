export interface IElementsService {
    readonly name: string
    getElements(): Promise<string[]>
}