import { css, BaseCustomWebComponentConstructorAppend, html } from '@node-projects/base-custom-webcomponent';

export enum targetType {
  'property' = 'property',
  'style' = 'style',
  'attribute' = 'attribute',
  'event' = 'event'
}

export enum valueType {
  'string' = 'string',
  'number' = 'number',
  'boolean' = 'boolean'
}

export class BindingsEditor extends BaseCustomWebComponentConstructorAppend {

  static override readonly style = css`
    * { font-size: 16px; }
    .list { 
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    `;

  static override readonly template = html`
   <div class="list" style="">
    <span>Expression</span>
    <div>
      <input style="width:100%;">
      <button>...</button>
    </div>
    <!--<span>Target</span>
    <select id="target">
        <option>Property</option>
        <option>Attribute</option>
        <option>Style</option>
        <option>Event</option>
    </select>-->
    <div>
      <input id="mode" type="checkbox"><label for="mode">Two Way</label>    
    </div>
    <div>
      <input id="inverted" type="checkbox"><label for="inverted">Inverted</label>   
    </div>
    <div>
      <input id="nullSafe" type="checkbox"><label for="nullSafe">Null Safe</label>   
    </div>
</div>
  `;

  constructor(targetType: targetType) {
    super();
  }



}

customElements.define('node-projects-bindings-editor', BindingsEditor);