import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { userInfo } from "./IMultiplayerService";

export class MultiplayerService {

    constructor(getUserInfo: () => userInfo, sendMessage: (message) => void, messageReceived: () => any) {
    }

    
    cursorsChanged: TypedEvent<string>;

}