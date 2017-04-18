import Selector from '../Selector';
import Specificity from '../Specificity';
import Sequence from '../dataTypes/Sequence';
import NodeValue from '../dataTypes/NodeValue';
import AttributeNode from '../dataTypes/AttributeNode';

/**
 * @extends {Selector}
 */
class AttributeAxis extends Selector {
	/**
	 * @param  {!Selector}    attributeTestSelector
	 */
	constructor (attributeTestSelector) {
		super(new Specificity({
			[Specificity.ATTRIBUTE_KIND]: 1
		}), Selector.RESULT_ORDERINGS.UNSORTED);

		this._attributeTestSelector = attributeTestSelector;
		this._getStringifiedValue = () => `(attribute ${this._attributeTestSelector.toString()})`;
	}

	/**
	 * @param   {../DynamicContext}  dynamicContext
	 * @return  {Sequence}
	 */
	evaluate (dynamicContext) {
		var contextItem = dynamicContext.contextItem,
			domFacade = dynamicContext.domFacade;

		if (!contextItem.instanceOfType('element()')) {
			return Sequence.empty();
		}

		var attributes = domFacade
			.getAllAttributes(contextItem.value)
			.map(function (attribute) {
				return new NodeValue(new AttributeNode(
					contextItem.value,
					attribute.name,
					attribute.value
				));
			});
		const attributeTestSelector = this._attributeTestSelector;
		return new Sequence(function* () {
			for (const childContext of dynamicContext.createSequenceIterator(new Sequence(attributes))) {
				const nodeIsMatch = attributeTestSelector.evaluate(childContext).getEffectiveBooleanValue();
				if (nodeIsMatch) {
					yield childContext.contextItem;
				}
			}
		});
	}
}
export default AttributeAxis;
