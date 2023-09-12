import { BaseCustomWebComponentConstructorAppend, css, html } from '@node-projects/base-custom-webcomponent';

export class EditTextOverlay extends BaseCustomWebComponentConstructorAppend {
  
  public static override readonly style = css``

  public static override readonly template = html`
    <div>
      <input type="text">
    </div>
  `
}