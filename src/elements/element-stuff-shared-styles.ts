const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="element-stuff-shared-styles">
  <template>
    <style>
      :host{
        display: block;
        height: 100%;
        overflow: auto;
        box-sizing: border-box;
      }
      .content-wrapper {
        padding: .5em;
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        grid-auto-rows: 30px;
      }
      label, input, select {
        display: inline-block;
        color: white;
        background: transparent;
        height: 24px;
        margin: 2px 0;
        padding: 0 2px 0 4px;
        width: 110px;
        white-space: nowrap;
      }
      label, .style-label {
        box-sizing: border-box;
        display: inline-block;
        margin-right: 20px;
        font-size: 13px;
        width: 90px;
      }
      label[for] {
        cursor: pointer;
      }
      input, select {
        border: 1px solid var(--input-border-color);
        border-radius: 5px;
        box-sizing: border-box;
        font-size: 11px;
        width: 100%;
      }
      /*input {
        margin-left: 4px;
      }*/
      input[disabled] {
        color: #BDBDBD;
      }
      select {
        background: transparent;
      }
      select:focus option {
        color: black;
      }
    </style>
  </template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
