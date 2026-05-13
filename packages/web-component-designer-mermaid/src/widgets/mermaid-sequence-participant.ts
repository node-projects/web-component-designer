import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { escapeLabel, sanitizeId } from "./mermaid-node.js";

enum MermaidSequenceParticipantType {
    participant = "participant",
    actor = "actor",
}

export class MermaidSequenceParticipant extends BaseCustomWebComponentConstructorAppend {
    static override readonly style = css`
    * {
        box-sizing: border-box;
    }

    #participant {
        align-items: center;
        background: white;
        border: 2px solid #333;
        color: #111;
        display: flex;
        font-family: Arial, sans-serif;
        font-size: 14px;
        height: 100%;
        justify-content: center;
        min-height: 42px;
        min-width: 120px;
        overflow: hidden;
        padding: 6px 10px;
        pointer-events: none;
        text-align: center;
        width: 100%;
    }

    #participant[data-participant-type="actor"] {
        border-radius: 999px;
    }
    `;

    static override readonly template = html`<div id="participant"></div>`;

    static readonly is = "mermaid-sequence-participant";

    public participantId: string = "Alice";
    public label: string = "Alice";
    public participantType: MermaidSequenceParticipantType = MermaidSequenceParticipantType.participant;

    private _participant: HTMLDivElement;

    static readonly properties = {
        participantId: String,
        label: String,
        participantType: MermaidSequenceParticipantType,
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._participant = this._getDomElement<HTMLDivElement>("participant");
    }

    async ready() {
        this._parseAttributesToProperties();
        this._render();
    }

    private _render() {
        this._participant.textContent = this.getAttribute("label") ?? this.label ?? this.getAttribute("participant-id") ?? this.participantId;
        this._participant.dataset.participantType = this.getAttribute("participant-type") ?? this.participantType;
    }

    public createMermaid() {
        const id = sanitizeId(this.getAttribute("participant-id") ?? this.participantId);
        const label = this.getAttribute("label") ?? this.label ?? id;
        const type = this.getAttribute("participant-type") ?? this.participantType;
        const keyword = type === MermaidSequenceParticipantType.actor ? "actor" : "participant";
        return label && label !== id ? `${keyword} ${id} as ${escapeLabel(label)}` : `${keyword} ${id}`;
    }
}

customElements.define(MermaidSequenceParticipant.is, MermaidSequenceParticipant);
