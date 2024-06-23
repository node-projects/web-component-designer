import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IMultiplayerMessage } from "./IMultiplayerService";

export class MultiplayerDataService {

    constructor() {

    }

    signOn(userInfo: userInfo) {

    }
    listUsers(): Promise<userInfo[]> {

    }

    send(message: IMultiplayerMessage<any>) {
        const data = JSON.stringify(message);
    }

    received = new TypedEvent<IMultiplayerMessage<any>>
}