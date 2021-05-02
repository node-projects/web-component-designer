import { html, BaseCustomWebComponentConstructorAppend } from '@node-projects/base-custom-webcomponent';

export class JsonPropertyPopupEditor extends BaseCustomWebComponentConstructorAppend {

  static override template = html`
    <div style="display: flex;">
      <input id="input" type="text">
      <button style="width: 30px;">...</button>
    </div>
  `;

  constructor() {
    super();

    //codeview
  }
}