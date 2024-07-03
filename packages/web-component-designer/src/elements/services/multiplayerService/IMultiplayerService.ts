/*import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IPoint } from "../../../interfaces/IPoint";

export interface IMultiplayerService {
    signOn(userInfo: userInfo);
    listUsers(): Promise<userInfo[]>;

    send(message: IMultiplayerMessage<any>);
    received: TypedEvent<IMultiplayerMessage<any>>;
}

export interface IMultiplayerMessage<T> {
    type: string;
    data: T;
}

export type userInfo = {
    name: string;
    color: string;
}

export type userContext = {
    name: string;
}

export type cursor = {
    point: IPoint
    state: 'none' | 'pointing' | 'chat'
    document: string
}*/