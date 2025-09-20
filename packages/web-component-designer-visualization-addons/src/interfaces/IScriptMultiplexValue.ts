export interface IScriptMultiplexValue {
     /**
     * signal - read the value from a Signal
     * property - read the value from a property of the customControl (not usable in screens)
     * signalInProperty - read the value from a Signal (wich name is in the Property)
     * event - read the value of a property of the event object
     * parameter - a parameter you hand over 
     * context - a value of the context
     * complexString - a string with signals (contained in {})
     * complexSignal - read the value from a signal wich name is build here (it can contain other signals in {})
     * expression - js expression, 'ctx' is context object
     * elementProperty - a property defined on the element raising the event
     */
    source: 'signal' | 'property' | 'signalInProperty' | 'event' | 'parameter' | 'complexString' | 'complexSignal' | 'expression' | 'context' | 'elementProperty';
    /**
     * Name of the signal, the property of the component or the parameter of the script
     * or for example in a event : srcElement.value to get the value of a input wich raises the event
     * @TJS-format signal
     */
    name: string;
}