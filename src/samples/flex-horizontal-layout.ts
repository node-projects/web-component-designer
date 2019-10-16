import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { customElement } from '@polymer/decorators';

@customElement("flex-horizontal-layout")
export class FlexHorizontalLayout extends PolymerElement {
  static get template() {
    return html`
      <style>
        #flexHorizontal {
          display:flex;
          flex-direction:row;
          background:white;
          padding:10px;
          width:300px;
        }
      #flexHorizontal1, #flexHorizontal2, #flexHorizontal3 {
        width:50px;
        height:50px;
        border:2px solid #673AB7;
        margin:10px;
      }
      </style>
      <div id="flexHorizontal">
        <div id="flexHorizontal1">one</div>
        <div id="flexHorizontal2" style="flex:1">two</div>
        <div id="flexHorizontal3">three</div>
      </div>
    `;
  }
}
