import { IDesignItem } from "../../item/IDesignItem.js";
import { EventsService } from "./EventsService.js";
import { IEvent } from "./IEvent.js";

export class WebcomponentManifestEventsService extends EventsService {

  override isHandledElementFromEventsService(designItem: IDesignItem): boolean {
    return this.__eventsList?.[designItem.name] != null;
  }

  override getPossibleEvents(designItem: IDesignItem): IEvent[] {
    return [...this.__eventsList[designItem.name], ...EventsService._simpleMouseEvents, ...EventsService._pointerEvents, ...EventsService._allElements, ...EventsService._focusableEvents];
  }

  override getEvent(designItem: IDesignItem, name: string): IEvent {
    let evt = this.getPossibleEvents(designItem).find(x => x.name == name);
    return evt ?? { name, propertyName: 'on' + name, eventObjectName: 'Event' };
  }

  private __eventsList: Record<string, IEvent[]>;

  constructor(manifest: any) {
    super();
    this._parseManifest(manifest);
  }

  private _parseManifest(manifest) {
    this.__eventsList = {};
    let declarations = [];
    for (let m of manifest.modules) {
      if (m.declarations)
        declarations.push(...m.declarations);
    }
    for (let m of manifest.modules) {
      for (let e of m.exports) {
        if (e.kind == 'custom-element-definition') {
          let declaration = declarations.find(x => x.name == e.declaration.name);
          if (declaration) {
            if (declaration.events) {
              let events: IEvent[] = [];
              for (let e of declaration.events) {
                events.push({ name: e.name })
              }
              if (events.length)
                this.__eventsList[e.name] = events;
            }
          } else {
            console.warn('declaration for ' + e.declaration.name + ' not found', manifest);
          }
        }
      }
    }
  }
}