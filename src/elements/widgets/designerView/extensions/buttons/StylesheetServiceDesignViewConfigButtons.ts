import { AbstractDesignViewConfigButton } from "./AbstractDesignViewConfigButton.js";

export const enableStylesheetService = 'enableStylesheetService';

export class StylesheetServiceDesignViewConfigButtons extends AbstractDesignViewConfigButton {

  constructor() {
    super(enableStylesheetService, "ss", "modify Stylesheet")
  }
}