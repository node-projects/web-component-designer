import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";

export abstract class DesignerToolbarPopup extends BaseCustomWebComponentConstructorAppend {
    static override readonly style = css`
        .container {
            width: 150px;
            min-height: 200px;
            color: white;
            background-color: rgb(64, 64, 64);
            border: 1px solid black;
        }

        header {
            text-align: center;
        }
    `;

    static override readonly template = html`
        <div class="container">
            <header><h2 id="title" style="margin: 0;"></h2></header>
            <main id="content-area"></main>
        </div>
    `;

    ready(){
        this._setTitle(this.getAttribute("title"));
    }

    protected _setTitle(title : string){
        this._getDomElement<HTMLElement>("title").innerHTML = title;
    }

    protected _setContent(elements : HTMLElement[]){
        let contentArea = this._getDomElement<HTMLElement>("content-area");
        for(let elem of elements){
            contentArea.appendChild(elem);
        }
    }

}