/* passes through events as they happen. You will not get events from before you start listening */
export class TypedEvent {
  constructor() {
    this.listeners = [];
    this.listenersOncer = [];

    this.on = listener => {
      this.listeners.push(listener);
      return {
        dispose: () => this.off(listener)
      };
    };

    this.once = listener => {
      this.listenersOncer.push(listener);
    };

    this.off = listener => {
      var callbackIndex = this.listeners.indexOf(listener);
      if (callbackIndex > -1) this.listeners.splice(callbackIndex, 1);
    };

    this.emit = event => {
      /** Update any general listeners */
      this.listeners.forEach(listener => listener(event));
      /** Clear the `once` queue */

      if (this.listenersOncer.length > 0) {
        const toCall = this.listenersOncer;
        this.listenersOncer = [];
        toCall.forEach(listener => listener(event));
      }
    };

    this.pipe = te => {
      return this.on(e => te.emit(e));
    };
  }

}