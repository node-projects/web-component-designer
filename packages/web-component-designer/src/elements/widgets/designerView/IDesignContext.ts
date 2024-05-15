import { TypedEvent } from "@node-projects/base-custom-webcomponent";

export interface IDesignContext {
  imports: string[];
  npmPackages: string[];
  extensionOptions: {
    [key: string]: any;
    gridExtensionShowOverlay: boolean;
    flexboxExtensionShowOverlay: boolean;
    invisibleElementExtensionShowOverlay: boolean;
    enableStylesheetService: boolean;
    basicStackedToolbarExtensionShowOverlay: boolean;
    simulateHoverOnHover: boolean;
    selectUnhitableElements: boolean;
  };
  extensionOptionsChanged: TypedEvent<void>;
}