import { TypedEvent } from '@node-projects/base-custom-webcomponent';
import { IDesignContext } from './IDesignContext.js';

export class DesignContext implements IDesignContext {
  public imports: string[] = [];
  public npmPackages: string[] = [];
  public extensionOptions: {
    [key: string]: any;
    gridExtensionShowOverlay: boolean;
    flexboxExtensionShowOverlay: boolean;
    invisibleElementExtensionShowOverlay: boolean;
    enableStylesheetService: boolean;
    basicStackedToolbarExtensionShowOverlay: boolean;
    simulateHoverOnHover: boolean;
    selectUnhitableElements: boolean;
  } = {
      gridExtensionShowOverlay: false,
      flexboxExtensionShowOverlay: false,
      invisibleElementExtensionShowOverlay: false,
      enableStylesheetService: false,
      basicStackedToolbarExtensionShowOverlay: false,
      simulateHoverOnHover: false,
      selectUnhitableElements: true,
    };
  extensionOptionsChanged = new TypedEvent<void>;
}