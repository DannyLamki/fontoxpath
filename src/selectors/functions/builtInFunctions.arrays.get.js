import DynamicContext from '../DynamicContext';
import Sequence from '../dataTypes/Sequence';
/**
 * @param  {!DynamicContext}  _dynamicContext
 * @param  {!Sequence}        arraySequence
 * @param  {!Sequence}        positionSequence
 * @return {!Sequence}
 */
export default function arrayGet (_dynamicContext, arraySequence, positionSequence) {
	var position = positionSequence.first().value,
	array = arraySequence.first();
	if (position <= 0 || position > array.members.length) {
		throw new Error('FOAY0001: array position out of bounds.');
	}
	return array.members[position - 1];
}
