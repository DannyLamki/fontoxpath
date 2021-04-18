import {JsonConvert} from "json2typescript"
/**
 * The widget class
 * @public
 */
export default class XSObjectFactory {
    private _jsonConvert: JsonConvert;
    constructor() {
        this._jsonConvert = new JsonConvert();
    }
    public getInstance<T>(jsonObject: any, classReference: { new(): T }) : T {
		let xsObject: T = this._jsonConvert.deserializeObject(jsonObject, classReference);
        return xsObject;
	}
}