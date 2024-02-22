import { IPoint } from "../../../interfaces/IPoint";

export interface IMultiplayerService {
    signOn(userInfo: userInfo);
    //submitState
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
}