import {JsonObject, JsonProperty} from "json2typescript";

@JsonObject("XSObject")
export default class XSObject {
    
    @JsonProperty("type", Number)
    public type: number;
    @JsonProperty("name", String)
    public name: string;
    @JsonProperty("namespace", String)
    public namespace: string;
    @JsonProperty("namespaceItem", String)
    public namespaceItem: string;

}