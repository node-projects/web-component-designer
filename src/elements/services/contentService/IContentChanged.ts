export interface IContentChanged {
    changeType: "added" | "removed" | "moved"
    element: HTMLElement
    parent: HTMLElement
}