type Constructor<T> = { new(...args: any[]): T };

export function ElementStuffBase<B extends Constructor<any>>(base: B) {
  class ElementStuffElementMixin extends base {
    ready() {
      super.ready();
      this._recomputeStuff();
      this.root.addEventListener('change', this._do.bind(this));
      this.root.addEventListener('color-picker-selected', this._do.bind(this));
    }

    _recomputeStuff() {
      this._stuff = [];
      let els = this.root.querySelectorAll('[name]');
      for (let i = 0 ; i < els.length; i++) {
        this._stuff.push(els[i].getAttribute('name'));
      }
    }

    _do(event) {
      let target = event.target;

      // Is it a custom thing?
      if (target.classList.contains('style-label')) {
        // Set the name on the next input
        target.nextElementSibling.name = target.value;
        this._recomputeStuff();
        return;
      }

      let value = target.value;
      if (target.classList.contains('custom-picker')) { value = target.color; }

      this.dispatchEvent(new CustomEvent('element-updated', {bubbles: true, composed: true, detail: {type: this.stuffType, name: target.getAttribute('name'), value: value, isAttribute: target.classList.contains('attribute'), node: this}}));
    }
  }

  return ElementStuffElementMixin;
}
