//import { JsonConvert } from "../node_modules/json2typescript/src/json2typescript/json-convert.js"
import XSObject from './built/src/xml-schema-api/XSObject.js';

let fileName;
let _instance;
let _typeComponents;

function fetchModel() {
    console.log("starting...");
    let myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json, text/plain, */*');
    myHeaders.append("Content-Type", "application/json");

    let raw = JSON.stringify({
        "transactionUUID":"4d727c24-d2d1-446d-a20b-61024eea798f",
        "topLevelDirectory":"IFRST_2018-03-16",
        "zipFileName":"IFRST_2018-03-16.zip",
        "decompressedDirectory":"IFRST_2018-03-16",
        "fromTaxonomyPackage":"false",
        "href":"IFRST_2018-03-16/LakmiSystems-20181231.xml"});

    let requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch("http://localhost:8101/getXBRLModelFromEntryPoint", requestOptions)
    .then(response => {
        if (!response.ok) {
            console.log(res.statusText);
        }else{
            console.log("It's ok but not");
        }
        return response.json()
    })
    .then(result => {
        //console.log(result);
        _instance = result.response.instance;
        _typeComponents = result.response.typeComponents;
        //console.log(_instance);
        //console.log(_typeComponents);
        constructXDM(_instance, _typeComponents);
    })
    .catch(error => console.log('error', error));
}
function constructXDM(instance, typeComponents) {
    let component = typeComponents[0];
    console.log(component);
    //let jsonConvert = new JsonConvert();
    //let xsObject = jsonConvert.deserializeObject(component, XSObject);
    //console.log(xsObject);
    //let xsModel = new XSModel();
    //xsModel.fromJSON(typeComponents);
    /*
    let documentElement = instance.childNodes[0].childNodes[1];
    let typeDefinitionId = documentElement.typeDefinition;
    console.log('typeDefinitionId >> ' + typeDefinitionId);
    
    let typeDefinition;
    typeComponents.some(component => {
        if(component.id === typeDefinitionId) {
            console.log(component.id);
            typeDefinition = component;
            return true;
        }else{
            return false;
        }
    });
    console.log(`${documentElement.prefix}:${documentElement.localName} >> ${typeDefinition.name}`);
    */
}
fetchModel();