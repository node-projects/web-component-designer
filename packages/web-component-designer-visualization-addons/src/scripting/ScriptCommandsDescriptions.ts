export interface ScriptCommandHelp {
  /** short hint shown next to the command name */
  description: string;
  /** a single command object, as JSON */
  example: string;
  /** optional longer clarification, shown below the example */
  note?: string;
}

export const nativeScriptCommandDescriptions: Record<string, ScriptCommandHelp> = {
  Comment: {
    description: 'has no effect on script execution',
    example: '{ "type": "Comment", "comment": "explains the next step" }',
  },
  OpenScreen: {
    description: 'navigate to a screen (with history)',
    example: '{ "type": "OpenScreen", "screen": "MyScreen" }',
  },
  OpenDialog: {
    description: 'open a screen as a movable/closable dialog',
    example: '{ "type": "OpenDialog", "screen": "MyScreen", "title": "My Dialog",\n  "moveable": true, "closeable": true }',
  },
  CloseDialog: {
    description: 'close the parent dialog this command runs in',
    example: '{ "type": "CloseDialog" }',
  },
  OpenUrl: {
    description: 'open an URL, optionally as an in-app dialog',
    example: '{ "type": "OpenUrl", "url": "https://example.com", "target": "_blank", "openInDialog": false }',
  },
  ShowMessageBox: {
    description: 'ask the user to confirm before continuing',
    example: '{ "type": "ShowMessageBox", "title": "Confirm", "message": "Are you sure?",\n  "messageType": "warning", "buttons": "yesNo", "resultSignal": ".Local.Result",\n  "exitScriptOnCancel": true }',
    note: 'exitScriptOnCancel: true stops the chain when the user picks a negative button.',
  },
  ShowPrompt: {
    description: 'ask the user for text input',
    example: '{ "type": "ShowPrompt", "title": "Name?", "message": "Enter a name",\n  "resultSignal": ".Local.Name", "exitScriptOnCancel": true }',
  },
  SetSignalValue: {
    description: 'write a signal / property',
    example: '{ "type": "SetSignalValue", "signal": ".Some.Signal", "value": true }',
    note: 'target: "signal" (default) | "property" (a screen/control property) | "elementProperty" (a property of the element raising the event).',
  },
  ToggleSignalValue: {
    description: 'toggle a boolean signal / property',
    example: '{ "type": "ToggleSignalValue", "signal": ".Some.Toggle" }',
  },
  ToggleSignalValueThroughList: {
    description: 'cycle a signal / property through a fixed list of values',
    example: '{ "type": "ToggleSignalValueThroughList", "signal": ".Some.Mode", "valueList": [1, 2, 3] }',
  },
  IncrementSignalValue: {
    description: 'increment a numeric signal / property',
    example: '{ "type": "IncrementSignalValue", "signal": ".Some.Counter", "value": 1 }',
  },
  DecrementSignalValue: {
    description: 'decrement a numeric signal / property',
    example: '{ "type": "DecrementSignalValue", "signal": ".Some.Counter", "value": 1 }',
  },
  CalculateSignalValue: {
    description: 'calculate a new signal value from a formula',
    example: '{ "type": "CalculateSignalValue", "targetSignal": ".Some.Result",\n  "formula": "{adapter.0.level} * 100 + 30" }',
    note: 'The formula can reference other signals in curly braces: {signalName}.',
  },
  SetBitInSignal: {
    description: 'set a single bit (by number) in a signal / property',
    example: '{ "type": "SetBitInSignal", "signal": ".Some.Bits", "bitNumber": 3 }',
  },
  ClearBitInSignal: {
    description: 'clear a single bit (by number) in a signal / property',
    example: '{ "type": "ClearBitInSignal", "signal": ".Some.Bits", "bitNumber": 3 }',
  },
  ToggleBitInSignal: {
    description: 'toggle a single bit (by number) in a signal / property',
    example: '{ "type": "ToggleBitInSignal", "signal": ".Some.Bits", "bitNumber": 3 }',
  },
  Javascript: {
    description: 'run a JavaScript snippet',
    example: '{ "type": "Javascript", "script": "console.log(context.element)" }',
    note: 'context: { event, element, shadowRoot, instance }.',
  },
  SetElementProperty: {
    description: 'set a property/attribute/CSS value/class on matching elements',
    example: '{ "type": "SetElementProperty", "target": "property", "targetSelectorTarget": "container",\n  "targetSelector": ".my-class", "name": "disabled", "value": true }',
    note: 'target: "property" (default) | "attribute" | "css" | "class". targetSelectorTarget: "container" (screen/customControl, default) | "element" (current element).',
  },
  Delay: {
    description: 'pause the script chain',
    example: '{ "type": "Delay", "value": 500 }',
  },
  Console: {
    description: 'write a message to the browser console',
    example: '{ "type": "Console", "target": "log", "message": "done" }',
    note: 'target: "log" (default) | "info" | "debug" | "warn" | "error".',
  },
  SwitchLanguage: {
    description: 'switch the active UI language',
    example: '{ "type": "SwitchLanguage", "language": "en" }',
  },
  Login: {
    description: 'log a user in',
    example: '{ "type": "Login", "username": "user", "password": "pass" }',
  },
  Logout: {
    description: 'log the current user out',
    example: '{ "type": "Logout" }',
  },
  SubscribeSignal: {
    description: 'subscribe to a signal so its updates are pushed to the client',
    example: '{ "type": "SubscribeSignal", "signal": ".Some.Signal", "oneTime": false }',
  },
  UnsubscribeSignal: {
    description: 'unsubscribe from a previously subscribed signal',
    example: '{ "type": "UnsubscribeSignal", "signal": ".Some.Signal" }',
  },
  WriteSignalsInGroup: {
    description: 'write all pending signal values of a named group',
    example: '{ "type": "WriteSignalsInGroup", "group": "MyGroup" }',
  },
  ClearSignalsInGroup: {
    description: 'clear all pending signal values of a named group',
    example: '{ "type": "ClearSignalsInGroup", "group": "MyGroup" }',
  },
  RunScript: {
    description: 'run another named script',
    example: '{ "type": "RunScript", "name": "MyScript", "scriptType": "SimpleScript" }',
  },
  CopySignalValuesFromFolder: {
    description: 'copy signal values from one signal folder to another',
    example: '{ "type": "CopySignalValuesFromFolder", "sourceFolder": ".Source", "destinationFolder": ".Target" }',
  },
  ExportSignalValuesAsJson: {
    description: 'export matching signal values as a downloadable JSON file',
    example: '{ "type": "ExportSignalValuesAsJson", "regex": "^\\\\.Some\\\\..*", "fileName": "export.json" }',
  },
  ImportSignalValuesFromJson: {
    description: 'import signal values from a JSON string',
    example: '{ "type": "ImportSignalValuesFromJson", "data": "{ \\".Some.Signal\\": true }" }',
  },
  Repeat: {
    description: 'jump back to a label a number of times, or indefinitely',
    example: '{ "type": "Repeat", "label": "lbl_loop", "count": 0, "mode": "eventValid" }',
    note: 'mode: "eventValid" (default, repeats until the event is no longer active) | "always" (repeats until count is 0 or indefinitely when count is 0).',
  },
  Condition: {
    description: 'compare two values and jump to a label depending on the result',
    example: '{ "type": "Condition", "value1": {"source":"signal","name":".Is.On"}, "value2": true,\n  "comparisonType": "==", "trueGotoLabel": "lbl_off", "falseGotoLabel": "lbl_on" }',
    note: 'comparisonType: ==null | !=null | ==true | ==false | == | != | > | < | >= | <= | && | ||.',
  },
  Exit: {
    description: 'stop executing the current script chain',
    example: '{ "type": "Exit" }',
  },
  Label: {
    description: 'a named jump target for Condition / Goto / Repeat',
    example: '{ "type": "Label", "label": "lbl_on" }',
  },
  Goto: {
    description: 'jump unconditionally to a label',
    example: '{ "type": "Goto", "label": "lbl_on" }',
  },
};
