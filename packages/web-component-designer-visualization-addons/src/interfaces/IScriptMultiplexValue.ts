export class IScriptMultiplexValue {
     /**
     * signal - read the value from a Signal
     * property - read the value from a property of the customControl (not usable in screens)
     * event - read the value of a property of the event object
     * parameter - a parameter you hand over 
     * complexString - a string with signals (contained in {})
     * complexSignal - read the value from a signal wich name is build here (it can contain other signals in {})
     * expression - js expression, 'ctx' is context object
     */
    source: 'signal' | 'property' | 'event' | 'parameter' | 'complexString' | 'complexSignal' | 'expression';
    /**
     * Name of the signal, the property of the component or the parameter of the script
     * or for example in a event : srcElement.value to get the value of a input wich raises the event
     * @TJS-format signal
     */
    name: string;
}