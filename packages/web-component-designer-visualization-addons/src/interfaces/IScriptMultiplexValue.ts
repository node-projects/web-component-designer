export class IScriptMultiplexValue {
     /**
     * signal - read the value from a Signal
     * property - read the value from a property of the customControl (not usable in screens)
     * event - read the value of a property of the event object
     * parameter - a paremter you hand over 
     */
    source: 'signal' | 'property' | 'event' | 'parameter';
    /**
     * Name of the ioBroker object or the property of the component or the parameter of the script
     * or for example in a event : srcElement.value to get the value of a input wich raises the event
     * @TJS-format signal
     */
    name: string;
}