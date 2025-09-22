import { IPoint } from '../../../interfaces/IPoint.js';
import { IBinding } from '../../item/IBinding.js';

export interface IElementDefinition {
  tag: string;
  /**
   * A path or a Object URL to an image
   */
  icon?: string;
  /**
   * A HTML String wich is used in the Palette
   */
  displayHtml?: string;
  name?: string;
  description?: string;
  import?: string;
  className?: string;
  type?: string;
  defaultContent?: any;
  defaultAttributes?: { [key: string]: string; };
  defaultStyles?: { [key: string]: string; };
  defaultWidth?: string;
  defaultHeight?: string;
  ghostElement?: Element;
  /**
   * Name of the Tool activated when selecting the element.
   * If none, the DrawElementTool is used
   */
  tool?: string;
  defaultBinding?: IBinding;

  /**
   * Offset of mouse pointer when dragged
   */
  mouseOffset?: IPoint
}