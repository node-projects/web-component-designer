
//dialog:{screenName: string, title: string, moveable: boolean, closeable: boolean, width: string, height: string, left: string, top: string}

export interface VisualizationUiHandler {
    switchLanguage(language: string);
    closeDialog(element: HTMLElement);
    openDialog();
}
