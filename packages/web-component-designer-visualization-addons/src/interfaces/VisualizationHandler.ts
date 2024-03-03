
type StateValue = string | number | boolean | null;

export interface State {
  value: StateValue;
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
  getState(id: string): Promise<State>;
  setState(id: string, val: State | StateValue, ack?: boolean): Promise<void>;
  subscribeState(id: string, cb: StateChangeHandler): Promise<void>;
  unsubscribeState(id: string, cb: StateChangeHandler): void;
  getObject(id: string): Promise<Signal>;
  getHistoricData(id: string, config: any);

  getSignalInformation(signal: Signal): SignalInformation;
};