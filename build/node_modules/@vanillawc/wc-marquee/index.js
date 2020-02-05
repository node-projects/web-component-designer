/* eslint no-undef: 0 */
class WCMarquee extends HTMLElement {
  static get observedAttributes () {
    return ['party'];
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (!this.__initialized) { return; }
    if (oldValue !== newValue) {
      this[name] = newValue;
    }
  }

  get party () { return this.hasAttribute('party'); }
  set party (value) {
    const party = this.hasAttribute('party');
    if (party) {
      this.setAttribute('party', '');
    } else {
      this.removeAttribute('party');
    }
    this.setParty();
  }

  constructor () {
    super();
    const template = document.createElement('template');
    template.innerHTML = WCMarquee.template();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.__element = this.shadowRoot.querySelector('.marquee');
    this.__initialized = false;
    this.__partifier = null;
  }

  async connectedCallback () {
    this.style.width = (this.style.width) ? this.style.width : '100%';
    this.style.fontFamily = (this.style.fontFamily) ? this.style.fontFamily : 'Comic Sans MS';
    if (this.hasAttribute('party')) {
      this.setParty();
    }

    this.__initialized = true;
  }

  setParty () {
    const party = this.hasAttribute('party');
    if (party) {
      this.__partifier = setInterval(() => {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        this.__element.style.color = `rgb(${r}, ${g}, ${b})`;
      }, 400);
    } else {
      if (this.__partifier) {
        this.__element.style.color = 'black';
        clearInterval(this.__partifier);
      }
    }
  }

  static template () {
    return `
      <style>
      .marquee {
        margin: 0 auto;
        white-space: nowrap;
        overflow: hidden;
        box-sizing: border-box;
      }
      
      .marquee span {
        display: inline-block;
        padding-left: 100%;
        animation: marquee 15s linear infinite;
      }
      
      @keyframes marquee {
        0% {
          transform: translate(0, 0);
        }
        100% {
          transform: translate(-100%, 0);
        }
      }
      </style>
      <p class="marquee" style="width: inherit;"><span><slot></slot></span></p>`;
  }
}

customElements.define('wc-marquee', WCMarquee);

export { WCMarquee };
