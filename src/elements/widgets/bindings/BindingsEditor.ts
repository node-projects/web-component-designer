import { css, BaseCustomWebComponentConstructorAppend, html } from '@node-projects/base-custom-webcomponent';

export class BindingsEditor extends BaseCustomWebComponentConstructorAppend {
  
  static override readonly style = css`
    * { font-size: 16px; }
    `;

  static override readonly template = html`
    <span style="position:absolute;top:6px;left:20px;">Expression</span>
    <input style="width:340px;height:24px;position:absolute;top:30px;left:20px;">
    <span style="position:absolute;top:78px;left:20px;">Target</span>
    <select id="target" style="width:347.5px;height:24px;position:absolute;left:20px;top:102px;">
        <option>Property</option>
        <option>Attribute</option>
        <option>Style</option>
        <option>Event</option>
    </select>
    <input id="mode" type="checkbox" style="width:24px;height:24px;position:absolute;top:143px;left:15.328125px;">
    <label for="mode" style="position:absolute;top:146px;left:45.328125px;">Two Way</label>
    <input id="inverted" type="checkbox" style="width:24px;height:24px;position:absolute;top:177px;left:15px;">
    <label for="inverted" style="position:absolute;top:180px;left:44.328125px;">Inverted</label>
    <input id="nullSafe" type="checkbox" style="width:24px;height:24px;position:absolute;top:208px;left:15.328125px;">
    <label for="nullSafe" style="position:absolute;top:211px;left:44.328125px;">Null Safe</label>
  `;

  constructor() {
    super();
  }

}

customElements.define('node-projects-bindings-editor', BindingsEditor);