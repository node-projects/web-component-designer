import { IElementsService } from './IElementsService';
import { IElementsJson } from './IElementsJson';

// Reads a Json File and provides the Elements listed there
export class JsonElementsService implements IElementsService {
    private _name: string;
    get name() { return this._name; }

    private _elementList: string[];
    private _resolveStored: (value: string[]) => void;

    getElements(): Promise<string[]> {
        if (this._elementList)
            return Promise.resolve(this._elementList);
        return new Promise((resolve) => this._resolveStored = resolve);
    }
    constructor(name: string, file: string) {
        this._name = name;
        let request = new XMLHttpRequest();
        request.open('GET', file);
        request.onreadystatechange = () => {
            let data = request.responseText;
            let parsed = JSON.parse(data) as IElementsJson;
            this._elementList = parsed.elements;
            if (this._resolveStored)
                this._resolveStored(this._elementList);
        }
        request.send();
    }
} 