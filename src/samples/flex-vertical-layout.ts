import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { customElement } from '@polymer/decorators';

@customElement("flex-vertical-layout")
export class FlexVerticalLayout extends PolymerElement {
  static get template() {
    return html`
      <style>
        #flexVertical {
          display:flex;
          flex-direction:column;
          background:white;
          padding:10px;
          height:300px;
          width: 100px;
        }
        #flexVertical1, #flexVertical2, #flexVertical3 {
          width:50px;
          height:50px;
          border:2px solid #673AB7;
          margin:10px;
        }
      </style>
      <div id="flexVertical">
        <div id="flexVertical1">one</div>
        <div id="flexVertical2" style="flex:1">two</div>
        <div id="flexVertical3">three</div>
      </div>
    `;
  }
}
