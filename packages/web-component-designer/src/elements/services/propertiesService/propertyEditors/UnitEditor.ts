import { BaseCustomWebComponentConstructorAppend, css, html } from '@node-projects/base-custom-webcomponent';

export class UnitEditor extends BaseCustomWebComponentConstructorAppend {

    public static override style = css`
    .container {
        display: grid;
        grid-template-columns: auto 40px 40px;
        position: relative;
        width: 100%;
        height: 100%;
        border: 1px solid #596c7a;
    }
    .container input{
        grid-column: 1;
        background-color: transparent;
        color: lightslategray;
        border: none;
    }
    .container select{
        grid-column: 3;
        background-color: transparent;
        color: lightslategray;
        width: 40px;
        border: none;
    }
    .arrow-up {
        grid-column: 2;
        background: none;
        border: none;
        cursor: pointer;
        color: #596c7a;
        font-size: 7px;
        position: absolute;
        width: 50px;
        height: 50%;
        text-align: center;
        place-self: center;
        top: 0%;
    }
    .arrow-down {
        grid-column: 2;
        background: none;
        border: none;
        cursor: pointer;
        color: #596c7a;
        font-size: 7px;
        position: absolute;
        width: 50px;
        height: 50%;
        text-align: center;
        place-self: center;
        top: 50%;
    }
`;

    public static override template = html`
    <div class="container" id="container">
        <input id="ip" type="text">
            <button type="button" class="arrow-up" id="arrow-up">&#9650;</button>
            <button type="button" class="arrow-down" id="arrow-down">&#9660;</button>
        <select id="unitSelect" style="display: none;">
            <option value="px">px</option>
            <option value="percent">%</option>
        </select> 
    </div>
    `;
    
    private _ip: HTMLInputElement;
    private _unitSelect: HTMLSelectElement;
    private _container: HTMLDivElement;
    private _arrowUp: HTMLButtonElement;
    private _arrowDown: HTMLButtonElement;

    constructor() {
        super();

        this._ip = this._getDomElement<HTMLInputElement>('ip');
        this._unitSelect = this._getDomElement<HTMLSelectElement>('unitSelect');
        this._container = this._getDomElement<HTMLDivElement>('container');
        this._arrowUp = this._getDomElement<HTMLButtonElement>('arrow-up');
        this._arrowDown = this._getDomElement<HTMLButtonElement>('arrow-down');

        this._container.addEventListener('mouseover', () => {
            this._unitSelect.style.display = 'block'
        }) 

        this._container.addEventListener('mouseleave', () => { 
            this._unitSelect.style.display = 'none'   
        })

        this._arrowUp.addEventListener('click', () => {
            console.log("+1")
        })

        this._arrowDown.addEventListener('click', () => {
            console.log("-1")
        })
    }

}

customElements.define("node-projects-web-component-designer-unit-editor", UnitEditor)