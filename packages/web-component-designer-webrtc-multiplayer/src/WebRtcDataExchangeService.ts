import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { WebRtcMultiplayerServer } from "./WebRtcMultiplayerServer.js";

export class WebRtcDataExchangeService implements IDataExchangeService {

    _connection: WebRtcMultiplayerServer;

    constructor(connection: WebRtcMultiplayerServer) {
this._connection = connection;
this._connection._message
    }

    send(data: IMultiplayerMessage<any>){
        const json = JSON.stringify(data);
        this._connection.send(json);
    }

    received=new TypedEvent<IMultiplayerMessage<any>>;
}