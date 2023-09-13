import { invisibleElementExtensionShowOverlayOptionName } from "../InvisibleElementExtensionProvider.js";
import { AbstractDesignViewConfigButton } from "./AbstractDesignViewConfigButton.js";

export class InvisibleElementExtensionDesignViewConfigButtons extends AbstractDesignViewConfigButton {
    constructor() {
    super(invisibleElementExtensionShowOverlayOptionName, "I", "show invisible div overlay")
  }
}