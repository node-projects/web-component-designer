import { css } from '@node-projects/base-custom-webcomponent';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { CursorLinePointerExtension } from './CursorLinePointerExtension.js';
import { IDesignerPointerExtension } from './IDesignerPointerExtension.js';
import { IDesignerPointerExtensionProvider } from './IDesignerPointerExtensionProvider.js';

export class CursorLinePointerExtensionProvider implements IDesignerPointerExtensionProvider {
  
  getExtension(designerCanvas: IDesignerCanvas): IDesignerPointerExtension {
    return new CursorLinePointerExtension(designerCanvas.extensionManager, designerCanvas)
  }
  
  style = css`
    .svg-cursor-line { stroke: black; pointer-events: none }
  `;
}