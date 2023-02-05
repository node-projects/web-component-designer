export interface IDesignerAddonJson {
    services: Record<string, string>,
    components: Record<string, {
        stylesheets: string[]
    }>
}