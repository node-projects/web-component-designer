export declare type ScriptCommands = Comment | OpenScreen | OpenUrl | OpenDialog | CloseDialog |
  ToggleSignalValue | SetSignalValue | IncrementSignalValue | DecrementSignalValue |
  SetBitInSignal | ClearBitInSignal | ToggleBitInSignal | Console | CalculateSignalValue |
  Javascript | SetElementProperty | Delay | SwitchLanguage |
  Login | Logout |
  SubscribeSignal | UnsubscribeSignal |
  WriteSignalsInGroup | ClearSiganlsInGroup |
  Condition | Exit | Label | RunScript | Goto |
  CopySignalValuesFromFolder | ShowMessageBox |
  ExportSignalValuesAsJson | ImportSignalValuesFromJson;


/* 
TODO:
Indirect Values in Scripts:
 
Indirection Source:
Object Values,
Current Element Property
*/

export interface Comment {
  type: 'Comment';
  comment: string;
}

export interface OpenScreen {
  type: 'OpenScreen';
  /**
   * Name of the Screen
   * @TJS-format screen
   */
  screen: string;
  title?: string;
  /**
   * If signals in screen are defined relative (starting with a '.'), this will be prepended
   */
  relativeSignalsPath?: string;
  noHistory?: boolean;
  closeable?: boolean;
  additionalData?: string;
}

export interface OpenDialog {
  type: 'OpenDialog';
  /**
   * Name of the Screen
   * @TJS-format screen
   */
  screen: string;
  title?: string;
  /**
   * If signals in screen are defined relative (starting with a '.'), this will be prepended
   */
  relativeSignalsPath?: string;
  moveable?: boolean;
  closeable?: boolean;

  width?: string;
  height?: string;

  left?: string;
  top?: string;
  additionalData?: string;
}

export interface ShowMessageBox {
  type: 'ShowMessageBox';
  /**
   * title text
   */
  title: string;
  /**
   * message text
   */
  message: string;
  /**
   * message type
   * @default info
   */
  messageType?: 'info' | 'warning' | 'error';
  /**
   * message text
   * @default ok
   */
  buttons: 'ok' | 'okCancel' | 'yesNo' | 'retryCancel' | 'yesNoCancel' | 'abortRetryIgnore' | 'cancelTryContinue';
  /**
   * number of the clicked button
   * @TJS-format signal
   */
  resultSignal: string;

  width?: string;
  height?: string;
  additionalData?: string;
}

//TODO: dialogId, closeChildDialogs
export interface CloseDialog {
  type: 'CloseDialog';
  /**
   * A dialogId. If empty the parent dialog will be closed
   * @TJS-format signal
   */
  //dialogId: string;
  additionalData?: string;
}

export interface OpenUrl {
  type: 'OpenUrl';
  url: string;
  /**
   * defaults to '_blank'
   */
  target: string;
  openInDialog: boolean;
  additionalData?: string;
}

export interface SetSignalValue {
  type: 'SetSignalValue';
  /**
   * Name of the signal
   * @TJS-format signal
   */
  signal: string;
  value: any;
  additionalData?: string;
}

export interface ToggleSignalValue {
  type: 'ToggleSignalValue';
  /**
   * Name of the signal
   * @TJS-format signal
   */
  signal: string;
  additionalData?: string;
}

//export interface ToggleSignalValueFromJsonArray {
//  type: 'ToggleSignalValueFromJsonArray';
//  /**
//   * Name of the signal
//   * @TJS-format signal
//   */
//  signal: string;
//  /**
//   * list of values (as json array string e.g. ['aa', 1, false])
//   */
//  list: string;
//}

export interface IncrementSignalValue {
  type: 'IncrementSignalValue';
  /**
   * Name of the signal
   * @TJS-format signal
   */
  signal: string;
  value: number;
  additionalData?: string;
}

export interface CalculateSignalValue {
  type: 'CalculateSignalValue';
  /**
   * Name of the signal
   * @TJS-format signal
   */
  targetSignal: string;
  /**
   * A formula to calculate the new signal value, can contain other signals in angle brackets: {}
   * Example: {adapter.0.level} * 100 + 30
   */
  formula: string;
  additionalData?: string;
}

export interface DecrementSignalValue {
  type: 'DecrementSignalValue';
  /**
   * Name of the signal
   * @TJS-format signal
   */
  signal: string;
  value: number;
  additionalData?: string;
}

export interface SetBitInSignal {
  type: 'SetBitInSignal';
  /**
   * Name of the signal
   * @TJS-format signal
   */
  signal: string;
  /**
   * @default 0
   */
  bitNumber: number;
  additionalData?: string;
}
export interface ClearBitInSignal {
  type: 'ClearBitInSignal';
  /**
   * Name of the signal
   * @TJS-format signal
   */
  signal: string;
  /**
   * @default 0
   */
  bitNumber: number;
  additionalData?: string;
}
export interface ToggleBitInSignal {
  type: 'ToggleBitInSignal';
  /**
   * Name of the signal
   * @TJS-format signal
   */
  signal: string;
  /**
   * @default 0
   */
  bitNumber: number;
  additionalData?: string;
}

export interface Javascript {
  type: 'Javascript';
  /**
   * Usable objects in Script: 
   * context : {event : Event, element: Element, shadowRoot: ShadowRoot, instance: Element }
   * @TJS-format script
   */
  script: string;
  additionalData?: string;
}

export interface SetElementProperty {
  type: 'SetElementProperty';
  /**
   * what of the elements do you want to set
   * @default property
   */
  target: 'property' | 'attribute' | 'css' | 'class';
  /**
   * where to search for the elements (used as a start)
   * element = currentElement
   * container = screen or customControl
   * @default container
   */
  targetSelectorTarget: 'container' | 'element';
  /**
   * wich parent, 0 = current, 1 = first parent, 2 = ...
   * of the targetSelectorTarget
   * @default 0
   */
  parentIndex: number;
  /**
   * css selector to find elements on targetSelectorTarget, if empty the targetSelectorTarget directly is used
   */
  targetSelector: string;
  /**
   * name of property/attribute or css value you want to set
   */
  name: string;
  /**
   * only for target: class
   */
  mode: 'add' | 'remove' | 'toggle';
  /**
   * value you want to set
   */
  value: any;
  additionalData?: string;
}

export interface Delay {
  type: 'Delay';
  /**
   * miliseconds to delay
   * @default 500
   */
  value: number;
  additionalData?: string;
}

export interface Console {
  type: 'Console';
  /**
  * target where to log
  * @default log
  */
  target: 'log' | 'info' | 'debug' | 'warn' | 'error';
  /**
   * console message
   */
  message: string;
  additionalData?: string;
}

export interface SwitchLanguage {
  type: 'SwitchLanguage';
  language: string;
  additionalData?: string;
}

export interface Logout {
  type: 'Logout';
  additionalData?: string;
}

export interface Login {
  type: 'Login';
  /**
  * username
  */
  username: 'string';
  /**
   * password
   */
  password: string;
  additionalData?: string;
}

export interface SubscribeSignal {
  type: 'SubscribeSignal';
  /**
   * Name of the signal
   * @TJS-format signal
   */
  signal: string;
  oneTime: boolean;
  additionalData?: string;
}

export interface UnsubscribeSignal {
  type: 'UnsubscribeSignal';
  /**
   * Name of the signal
   * @TJS-format signal
   */
  signal: string;
  additionalData?: string;
}

export interface WriteSignalsInGroup {
  type: 'WriteSignalsInGroup';
  /**
  * Name of the Group
  */
  group: string;
  additionalData?: string;
}

export interface ClearSiganlsInGroup {
  type: 'ClearSiganlsInGroup';
  /**
  * Name of the Group
  */
  group: string;
  additionalData?: string;
}

export interface CopySignalValuesFromFolder {
  type: 'CopySignalValuesFromFolder';
  /**
   * name of the source folder
   */
  sourceFolder: string;
  /**
   * name of destination folder
   */
  destinationFolder?: number;
  additionalData?: string;
}

export interface ExportSignalValuesAsJson {
  type: 'ExportSignalValuesAsJson';
  /**
   * regex to select the signals (every matching one)
   */
  regex: string;
  /**
   * wait for updated values from the connection
   */
  waitForUpdatedValues?: boolean;
  /**
   * download filename
   */
  fileName?: string;
  additionalData?: string;
}

export interface ImportSignalValuesFromJson {
  type: 'ImportSignalValuesFromJson';
  /**
   * json data with the values
   */
  data: string;
  additionalData?: string;
}

export interface Condition {
  type: 'Condition';
  /**
  * Name of the value1
  * @TJS-format complex
  */
  value1: any;
  value2?: any;
  comparisonType: '==null' | '!=null' | '==true' | '==false' | '==' | '!=' | '>' | '<' | '>=' | '<=';
  /**
  * Name of the label to jumpe to when condition is true
  */
  trueGotoLabel?: string;
  trueScriptName?: string;
  trueScriptType?: string;
  falseGotoLabel?: string;
  falseScriptName?: string;
  falseScriptType?: string;
  additionalData?: string;
}

export interface Exit {
  type: 'Exit';
  additionalData?: string;
}

export interface Label {
  type: 'Label';
  label: string;
  additionalData?: string;
}

export interface Goto {
  type: 'Goto';
  label: string;
  additionalData?: string;
}

export interface RunScript {
  type: 'RunScript';
  /**
  * Name of the Script
  */
  name: 'string';
  /**
  * Type of the Script
  */
  scriptType: 'string';
  additionalData?: string;
}