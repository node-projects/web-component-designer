
type StateValue = string | number | boolean | null;

export interface State {
  val: StateValue;
}

export interface Signal {
  "$type": 'Signal'
}

export interface SignalInformation {
  type: 'string' | 'number' | 'boolean'
  role: 'url' | 'datetime' | 'date' | 'time',
  writeable: boolean,
}

type StateChangeHandler = (id: string, state: State) => void

export interface VisualizationHandler {
  getNormalizedSignalName(id: string, relativeSignalPath?: string, element?: Element): string;
  
  getState(id: string): Promise<State>;
  setState(id: string, val: State | StateValue, ack?: boolean): Promise<void>;
  subscribeState(id: string, cb: StateChangeHandler): any;
  unsubscribeState(id: string, cb: StateChangeHandler, info: any): void;
  getHistoricData(id: string, config: any);
  getObject(id: string): Promise<Signal>;

  getAllNames(type: string);
  getSignalInformation(signal: Signal): SignalInformation;
};