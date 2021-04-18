import * as fontoxpath from '../src/index';
//declare var json2typescript: any;
//import * as json2typescript from '../../node_modules/json2typescript/index';
//import XSObject from '../src/xml-schema-api/XSObject';
import XSObjectFactory from '../src/xml-schema-impl/XSObjectFactory';

const allowXQuery = document.getElementById('allowXQuery') as HTMLInputElement;
const allowXQueryUpdateFacility = document.getElementById(
	'allowXQueryUpdateFacility'
) as HTMLInputElement;
const astJsonMl = document.getElementById('astJsonMl');
const astXml = document.getElementById('astXml');
const bucketField = document.getElementById('bucketField');
const log = document.getElementById('log');
const resultText = document.getElementById('resultText');
const updateResult = document.getElementById('updateResult');
const xmlSource = document.getElementById('xmlSource');
const xpathField = document.getElementById('xpathField');
const traceOutput = document.getElementById('traceOutput');

const domParser = new DOMParser();

let xmlDoc: Document;

function lakmiGreet() {
	let lakmi = new fontoxpath.LakmiGreeting('Hi...');
	lakmi.greet();
}

function setCookie() {
	const source = encodeURIComponent(xmlSource.innerText);
	const xpath = encodeURIComponent(xpathField.innerText);

	document.cookie = `xpath-editor-state=${allowXQuery.checked ? 1 : 0}${
		allowXQueryUpdateFacility.checked ? 1 : 0
	}${source.length}~${source}${xpath};max-age=${60 * 60 * 24 * 7}`;
}

function serializeAsJsonMl(node: Node): any[] | string {
	switch (node.nodeType) {
		case Node.TEXT_NODE:
			return (node as Text).nodeValue;
		case Node.COMMENT_NODE:
			return (node as Comment).data ? ['!', (node as Comment).data] : ['!'];
		case Node.PROCESSING_INSTRUCTION_NODE:
			return (node as ProcessingInstruction).data
				? [
						'?' + (node as ProcessingInstruction).target,
						(node as ProcessingInstruction).data,
				  ]
				: ['?' + (node as ProcessingInstruction).target];
		case Node.DOCUMENT_TYPE_NODE:
			return [
				'!DOCTYPE',
				(node as DocumentType).name,
				(node as DocumentType).publicId,
				(node as DocumentType).systemId,
			];
		default:
			// Serialize element
			const jsonml = [node.nodeName] as any[];

			if ((node as Element).attributes && (node as Element).attributes.length) {
				const attributes = {};

				for (let i = 0, l = (node as Element).attributes.length; i < l; ++i) {
					const attr = (node as Element).attributes[i];
					attributes[attr.name] = attr.value;
				}

				jsonml[1] = attributes;
			}

			// Serialize child nodes
			for (
				let childNode: Node = (node as Element).firstChild;
				childNode;
				childNode = childNode.nextSibling
			) {
				jsonml.push(serializeAsJsonMl(childNode));
			}

			return jsonml;
	}
}

function stringifyJsonMl(what: any, indent: number, n: number) {
	const filler = Array(indent).fill(' ').join('');
	switch (typeof what) {
		case 'object': {
			if (Array.isArray(what)) {
				return what.map((w, i) => stringifyJsonMl(w, indent + 2, i)).join('\n');
			}
			if (what === null) {
				return filler + what;
			}
			if (n !== 1) {
				console.warn('Attributes at the wrong place!!!');
			}
			return Object.keys(what)
				.map((k) => `${filler}⤷${k}: ${what[k] === null ? 'null' : `"${what[k]}"`}`)
				.join('\n');
		}
		default: {
			if (n === 0) {
				return filler + what;
			}
			return filler + '  "' + what + '"';
		}
	}
}

function indentXml(document: Document): string {
	let depth = 0;
	const elements = document.documentElement.outerHTML.split(/></g);
	const prettiedXml = [];
	elements.forEach((element) => {
		let indent: string;
		let row = '<' + element + '>';
		if (element === elements[0]) {
			row = row.substring(1);
		} else if (element === elements[elements.length - 1]) {
			row = row.substring(0, row.length - 1);
		}

		if (row.substring(row.length - 2) === '/>') {
			indent = Array(depth).fill('  ').join('');
		} else {
			switch (row.search(/<\//g)) {
				case -1:
					indent = Array(depth++)
						.fill('  ')
						.join('');
					break;
				case 0:
					indent = Array(--depth)
						.fill('  ')
						.join('');
					break;
				default:
					indent = Array(depth).fill('  ').join('');
					break;
			}
		}

		prettiedXml.push(indent + row + '\n');
	});
	return prettiedXml.join('');
}

function jsonXmlReplacer(_key: string, value: any): any {
	if (value instanceof Attr) {
		const attrString = [];
		if (value.namespaceURI) {
			attrString.push(`Q{${value.namespaceURI}}`);
		}
		attrString.push(value.localName, '="', value.value, '"');
		return attrString.join('');
	}

	if (value instanceof Node) {
		return new XMLSerializer().serializeToString(value);
	}
	if (value instanceof Function) {
		return `function: "${value.name}"`;
	}

	return value;
}

async function runUpdatingXQuery(script: string) {
	const result = await fontoxpath.evaluateUpdatingExpression(script, xmlDoc, null, null, {
		debug: true,
		disableCache: true,
		logger: {
			trace: (m) => {
				traceOutput.textContent = m;
				console.log(m);
			},
		},
	});

	resultText.innerText = JSON.stringify(result, jsonXmlReplacer, '  ');
	fontoxpath.executePendingUpdateList(result.pendingUpdateList, null, null, null);
	updateResult.innerText = new XMLSerializer().serializeToString(xmlDoc);
}

async function runNormalXPath(script: string, asXQuery: boolean) {
	const raw = [];
	const it = fontoxpath.evaluateXPathToAsyncIterator(script, xmlDoc, null, null, {
		debug: true,
		disableCache: true,
		language: asXQuery
			? fontoxpath.evaluateXPath.XQUERY_3_1_LANGUAGE
			: fontoxpath.evaluateXPath.XPATH_3_1_LANGUAGE,
		logger: {
			trace: (m) => {
				traceOutput.textContent = m;
				console.log(m);
			},
		},
	});

	for (let item = await it.next(); !item.done; item = await it.next()) {
		raw.push(item.value);
	}
	resultText.innerText = JSON.stringify(raw, jsonXmlReplacer, '  ');
}

async function rerunXPath() {
	// Clear results from previous run
	astJsonMl.innerText = '';
	astXml.innerText = '';
	log.innerText = '';
	resultText.innerText = '';
	updateResult.innerText = '';
	traceOutput.innerText = '';

	const xpath = xpathField.innerText;

	try {
		// First try to get the AST as it has a higher change of succeeding
		const document = new Document();
		const ast = fontoxpath.parseScript<Element>(
			xpath,
			{
				language: fontoxpath.evaluateXPath.XQUERY_3_1_LANGUAGE,
				debug: false,
			},
			document
		);
		const astInJsonMl = serializeAsJsonMl(ast);
		astJsonMl.innerText = stringifyJsonMl(astInJsonMl, 0, 0);
		document.appendChild(ast);
		document.documentElement.setAttributeNS(
			'http://www.w3.org/2001/XMLSchema-instance',
			'xsi:schemaLocation',
			`http://www.w3.org/2005/XQueryX http://www.w3.org/2005/XQueryX/xqueryx.xsd`
		);
		document.normalize();

		const prettiedXml = indentXml(document);
		astXml.innerText = prettiedXml;
		(window as any).hljs.highlightBlock(astXml);

		if (allowXQueryUpdateFacility.checked) {
			await runUpdatingXQuery(xpath);
		} else {
			await runNormalXPath(xpath, allowXQuery.checked);
		}

		(window as any).hljs.highlightBlock(resultText);
		(window as any).hljs.highlightBlock(updateResult);
	} catch (err) {
		let errorMessage = err.message;
		if (err.location) {
			const start = err.location.start.offset;
			errorMessage += '\n\n' + xpath.substring(0, start) + '[HERE]' + xpath.substring(start);
		}

		log.innerText = errorMessage;
		return;
	}

	bucketField.innerText = allowXQuery.checked
		? 'Buckets can not be used in XQuery'
		: fontoxpath.getBucketForSelector(xpath);
}

xmlSource.oninput = (_evt) => {
	xmlDoc = domParser.parseFromString(xmlSource.innerText, 'text/xml');
	setCookie();
	if (fontoxpath.evaluateXPathToBoolean('//parseerror', xmlDoc, fontoxpath.domFacade)) {
		log.innerText = 'Error: invalid XML';
		return;
	}

	rerunXPath();
};

xpathField.oninput = (_evt) => {
	setCookie();
	try {
		xmlDoc = domParser.parseFromString(xmlSource.innerText, 'text/xml');

		rerunXPath();
	} catch (_) {
		// Catch all exceptions
	}
};

function loadFromCookie() {
	const cookie = document.cookie.split(/;\s/g).find((c) => c.startsWith('xpath-editor-state='));

	if (!cookie) {
		xmlSource.innerText = `<xml>
	<herp>Herp</herp>
	<derp id="durp">derp</derp>
	<hurr durr="durrdurrdurr">durrrrrr</hurr>
</xml>`;
		(window as any).hljs.highlightBlock(xmlSource);
		return;
	}

	const headerPartLength = 'xpath-editor-state='.length;
	const firstPart = cookie.match(/^xpath-editor-state=(\d+)~/)[1];
	// The first two characters are actually the state of the xquery and xquf checkboxes
	allowXQuery.checked = firstPart[0] === '1';

	allowXQueryUpdateFacility.checked = firstPart[1] === '1';

	const sourceLengthString = firstPart.substring(2);

	const sourceStart = headerPartLength + firstPart.length + 1;
	const sourceLength = parseInt(sourceLengthString, 10);
	const source = cookie.substring(sourceStart, sourceStart + sourceLength);

	xmlSource.innerText = decodeURIComponent(source);
	(window as any).hljs.highlightBlock(xmlSource);
	xmlDoc = domParser.parseFromString(decodeURIComponent(source), 'text/xml');

	const xpathStartOffset = sourceStart + sourceLength;
	xpathField.innerText = decodeURIComponent(cookie.substring(xpathStartOffset));
}

let _instance: JSON;
let _typeComponents: JSON;

function fetchModel() {
    console.log("starting...");
    let myHeaders: Headers = new Headers();
    myHeaders.append('Accept', 'application/json, text/plain, */*');
    myHeaders.append("Content-Type", "application/json");

    let raw: string = JSON.stringify({
        "transactionUUID":"4d727c24-d2d1-446d-a20b-61024eea798f",
        "topLevelDirectory":"IFRST_2018-03-16",
        "zipFileName":"IFRST_2018-03-16.zip",
        "decompressedDirectory":"IFRST_2018-03-16",
        "fromTaxonomyPackage":"false",
        "href":"IFRST_2018-03-16/LakmiSystems-20181231.xml"});

    let requestOptions:RequestInit = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch("http://localhost:8101/getXBRLModelFromEntryPoint", requestOptions)
    .then(response => {
        if (!response.ok) {
            console.log(response.statusText);
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
function constructXDM(instance: JSON, typeComponents: JSON) {
    let component: JSON = typeComponents[0];
    console.log(component);
	//let XSObjectFactory = new fontoxpath.XSObjectFactory();
    /*
	let xsObject:XSObject = jsonConvert.deserializeObject(component, XSObject);
    console.log(xsObject);
	*/
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

loadFromCookie();

rerunXPath();

lakmiGreet();

fetchModel();