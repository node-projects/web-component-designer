import { css } from '@node-projects/base-custom-webcomponent';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerPointerExtension } from './IDesignerPointerExtension.js';
import { IDesignerPointerExtensionProvider } from './IDesignerPointerExtensionProvider.js';
import { LinePointerExtension } from './LinePointerExtension.js';

export class LinePointerExtensionProvider implements IDesignerPointerExtensionProvider {
  getExtension(designerCanvas: IDesignerCanvas): IDesignerPointerExtension {
    return new LinePointerExtension(designerCanvas.extensionManager, designerCanvas)
  }
  
  style = css`
    .svg-cursor-line-dashed { stroke: black; pointer-events: none; stroke-dasharray: 4 4 }
  `;
}