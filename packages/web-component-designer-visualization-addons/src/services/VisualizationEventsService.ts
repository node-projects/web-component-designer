import {
  EventsService,
  IDesignItem,
  IEvent,
} from "@node-projects/web-component-designer";

export const cyclicAttributeName = 'cyclic';

export class VisualizationEventsService extends EventsService {
  public static _cyclicEvent: IEvent[] = [
    {
      name: `${cyclicAttributeName}:100`,
      propertyName: undefined,
      eventObjectName: "Event",
      description: "this event will retrigger itself every 100 ms",
    },
  ];

  public override getPossibleEvents(designItem: IDesignItem): IEvent[] {
    let events = super.getPossibleEvents(designItem);
    events.push(...VisualizationEventsService._cyclicEvent);
    return events;
  }

  public override getEvent(designItem: IDesignItem, name: string): IEvent {
    if (name.includes(cyclicAttributeName)) {
      let evt = VisualizationEventsService._cyclicEvent.find(
        (x) => x.name == name,
      );
      return (
        evt ?? { name, propertyName: "on" + name, eventObjectName: "Event" }
      );
    }

    return super.getEvent(designItem, name);
  }
}
