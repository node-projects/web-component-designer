import { IDesignItem } from '../../item/IDesignItem.js';
import { IHtmlWriterService } from './IHtmlWriterService.js';
import { IndentedTextWriter } from '../../helper/IndentedTextWriter.js';

//needs InternalBindinsgStorrageService -> keeps bindings
export class LitTsElementWriterService implements IHtmlWriterService {
  write(indentedTextWriter: IndentedTextWriter, designItems: IDesignItem[], rootContainerKeepInline: boolean) {
    throw new Error('Method not implemented.');
  }

  static head = `import { html, css, LitElement, CSSResultArray } from 'lit';
import { property, customElement } from 'lit/decorators.js';

@customElement('$$elementName')
class $$className extends LitElement {
  static get styles(): CSSResultArray {
    return [
      css\`
$$css
      \`,
    ];
  }

  //@property({ type: String }) btnStyle: QingButtonStyle = '';
  //@property({ type: Boolean, reflect: true }) selected = false;

  //private buttonElement: HTMLButtonElement | null = null;

  /*firstUpdated() {
    if (!this.shadowRoot) {
      throw new Error('Unexpected undefined shadowRoot');
    }
    this.buttonElement = this.shadowRoot.querySelector('button');
  }*/

  render() {
    return html\`$$html\`;
  }
}

export default $$className;

declare global {
  interface HTMLElementTagNameMap {
    '$$elementName': $$className;
  }
}`


}