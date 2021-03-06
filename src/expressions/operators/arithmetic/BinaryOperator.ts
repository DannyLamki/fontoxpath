import atomize from '../../dataTypes/atomize';
import castToType from '../../dataTypes/castToType';
import createAtomicValue from '../../dataTypes/createAtomicValue';
import isSubtypeOf from '../../dataTypes/isSubtypeOf';
import sequenceFactory from '../../dataTypes/sequenceFactory';
import { ValueType } from '../../dataTypes/Value';
import {
	addDuration as addDurationToDateTime,
	subtract as dateTimeSubtract,
	subtractDuration as subtractDurationFromDateTime,
} from '../../dataTypes/valueTypes/DateTime';
import {
	add as dayTimeDurationAdd,
	divide as dayTimeDurationDivide,
	divideByDayTimeDuration as dayTimeDurationDivideByDayTimeDuration,
	multiply as dayTimeDurationMultiply,
	subtract as dayTimeDurationSubtract,
} from '../../dataTypes/valueTypes/DayTimeDuration';
import {
	add as yearMonthDurationAdd,
	divide as yearMonthDurationDivide,
	divideByYearMonthDuration as yearMonthDurationDivideByYearMonthDuration,
	multiply as yearMonthDurationMultiply,
	subtract as yearMonthDurationSubtract,
} from '../../dataTypes/valueTypes/YearMonthDuration';
import Expression from '../../Expression';

function determineReturnType(typeA: ValueType, typeB: ValueType): ValueType {
	if (isSubtypeOf(typeA, 'xs:integer') && isSubtypeOf(typeB, 'xs:integer')) {
		return 'xs:integer';
	}
	if (isSubtypeOf(typeA, 'xs:decimal') && isSubtypeOf(typeB, 'xs:decimal')) {
		return 'xs:decimal';
	}
	if (isSubtypeOf(typeA, 'xs:float') && isSubtypeOf(typeB, 'xs:float')) {
		return 'xs:float';
	}
	return 'xs:double';
}

function generateBinaryOperatorFunction(operator, typeA: ValueType, typeB: ValueType) {
	let castFunctionForValueA = null;
	let castFunctionForValueB = null;

	if (isSubtypeOf(typeA, 'xs:untypedAtomic')) {
		castFunctionForValueA = (value) => castToType(value, 'xs:double');
		typeA = 'xs:double';
	}
	if (isSubtypeOf(typeB, 'xs:untypedAtomic')) {
		castFunctionForValueB = (value) => castToType(value, 'xs:double');
		typeB = 'xs:double';
	}

	function applyCastFunctions(valueA, valueB) {
		return {
			castA: castFunctionForValueA ? castFunctionForValueA(valueA) : valueA,
			castB: castFunctionForValueB ? castFunctionForValueB(valueB) : valueB,
		};
	}

	if (isSubtypeOf(typeA, 'xs:numeric') && isSubtypeOf(typeB, 'xs:numeric')) {
		switch (operator) {
			case 'addOp': {
				const returnType = determineReturnType(typeA, typeB);
				return (a, b) => {
					const { castA, castB } = applyCastFunctions(a, b);
					return createAtomicValue(castA.value + castB.value, returnType);
				};
			}
			case 'subtractOp': {
				const returnType = determineReturnType(typeA, typeB);
				return (a, b) => {
					const { castA, castB } = applyCastFunctions(a, b);
					return createAtomicValue(castA.value - castB.value, returnType);
				};
			}
			case 'multiplyOp': {
				const returnType = determineReturnType(typeA, typeB);
				return (a, b) => {
					const { castA, castB } = applyCastFunctions(a, b);
					return createAtomicValue(castA.value * castB.value, returnType);
				};
			}
			case 'divOp': {
				let returnType = determineReturnType(typeA, typeB);
				if (returnType === 'xs:integer') {
					returnType = 'xs:decimal';
				}
				return (a, b) => {
					const { castA, castB } = applyCastFunctions(a, b);
					return createAtomicValue(castA.value / castB.value, returnType);
				};
			}
			case 'idivOp':
				return (a, b) => {
					const { castA, castB } = applyCastFunctions(a, b);
					if (castB.value === 0) {
						throw new Error('FOAR0001: Divisor of idiv operator cannot be (-)0');
					}
					if (
						Number.isNaN(castA.value) ||
						Number.isNaN(castB.value) ||
						!Number.isFinite(castA.value)
					) {
						throw new Error(
							'FOAR0002: One of the operands of idiv is NaN or the first operand is (-)INF'
						);
					}
					if (Number.isFinite(castA.value) && !Number.isFinite(castB.value)) {
						return createAtomicValue(0, 'xs:integer');
					}
					return createAtomicValue(Math.trunc(castA.value / castB.value), 'xs:integer');
				};
			case 'modOp': {
				const returnType = determineReturnType(typeA, typeB);

				return (a, b) => {
					const { castA, castB } = applyCastFunctions(a, b);
					return createAtomicValue(castA.value % castB.value, returnType);
				};
			}
		}
	}

	if (isSubtypeOf(typeA, 'xs:yearMonthDuration') && isSubtypeOf(typeB, 'xs:yearMonthDuration')) {
		switch (operator) {
			case 'addOp':
				return (a, b) => {
					const { castA, castB } = applyCastFunctions(a, b);
					return createAtomicValue(
						yearMonthDurationAdd(castA.value, castB.value),
						'xs:yearMonthDuration'
					);
				};
			case 'subtractOp':
				return (a, b) => {
					const { castA, castB } = applyCastFunctions(a, b);
					return createAtomicValue(
						yearMonthDurationSubtract(castA.value, castB.value),
						'xs:yearMonthDuration'
					);
				};
			case 'divOp':
				return (a, b) => {
					const { castA, castB } = applyCastFunctions(a, b);
					return createAtomicValue(
						yearMonthDurationDivideByYearMonthDuration(castA.value, castB.value),
						'xs:decimal'
					);
				};
		}
	}

	if (isSubtypeOf(typeA, 'xs:yearMonthDuration') && isSubtypeOf(typeB, 'xs:numeric')) {
		switch (operator) {
			case 'multiplyOp':
				return (a, b) => {
					const { castA, castB } = applyCastFunctions(a, b);
					return createAtomicValue(
						yearMonthDurationMultiply(castA.value, castB.value),
						'xs:yearMonthDuration'
					);
				};
			case 'divOp':
				return (a, b) => {
					const { castA, castB } = applyCastFunctions(a, b);
					return createAtomicValue(
						yearMonthDurationDivide(castA.value, castB.value),
						'xs:yearMonthDuration'
					);
				};
		}
	}

	if (isSubtypeOf(typeA, 'xs:numeric') && isSubtypeOf(typeB, 'xs:yearMonthDuration')) {
		if (operator === 'multiplyOp') {
			return (a, b) => {
				const { castA, castB } = applyCastFunctions(a, b);
				return createAtomicValue(
					yearMonthDurationMultiply(castB.value, castA.value),
					'xs:yearMonthDuration'
				);
			};
		}
	}

	if (isSubtypeOf(typeA, 'xs:dayTimeDuration') && isSubtypeOf(typeB, 'xs:dayTimeDuration')) {
		switch (operator) {
			case 'addOp':
				return (a, b) => {
					const { castA, castB } = applyCastFunctions(a, b);
					return createAtomicValue(
						dayTimeDurationAdd(castA.value, castB.value),
						'xs:dayTimeDuration'
					);
				};
			case 'subtractOp':
				return (a, b) => {
					const { castA, castB } = applyCastFunctions(a, b);
					return createAtomicValue(
						dayTimeDurationSubtract(castA.value, castB.value),
						'xs:dayTimeDuration'
					);
				};
			case 'divOp':
				return (a, b) => {
					const { castA, castB } = applyCastFunctions(a, b);
					return createAtomicValue(
						dayTimeDurationDivideByDayTimeDuration(castA.value, castB.value),
						'xs:decimal'
					);
				};
		}
	}
	if (isSubtypeOf(typeA, 'xs:dayTimeDuration') && isSubtypeOf(typeB, 'xs:numeric')) {
		switch (operator) {
			case 'multiplyOp':
				return (a, b) => {
					const { castA, castB } = applyCastFunctions(a, b);
					return createAtomicValue(
						dayTimeDurationMultiply(castA.value, castB.value),
						'xs:dayTimeDuration'
					);
				};
			case 'divOp':
				return (a, b) => {
					const { castA, castB } = applyCastFunctions(a, b);
					return createAtomicValue(
						dayTimeDurationDivide(castA.value, castB.value),
						'xs:dayTimeDuration'
					);
				};
		}
	}
	if (isSubtypeOf(typeA, 'xs:numeric') && isSubtypeOf(typeB, 'xs:dayTimeDuration')) {
		if (operator === 'multiplyOp') {
			return (a, b) => {
				const { castA, castB } = applyCastFunctions(a, b);
				return createAtomicValue(
					dayTimeDurationMultiply(castB.value, castA.value),
					'xs:dayTimeDuration'
				);
			};
		}
	}

	if (
		(isSubtypeOf(typeA, 'xs:dateTime') && isSubtypeOf(typeB, 'xs:dateTime')) ||
		(isSubtypeOf(typeA, 'xs:date') && isSubtypeOf(typeB, 'xs:date')) ||
		(isSubtypeOf(typeA, 'xs:time') && isSubtypeOf(typeB, 'xs:time'))
	) {
		if (operator === 'subtractOp') {
			return (a, b) => {
				const { castA, castB } = applyCastFunctions(a, b);
				return createAtomicValue(
					dateTimeSubtract(castA.value, castB.value),
					'xs:dayTimeDuration'
				);
			};
		}

		throw new Error(`XPTY0004: ${operator} not available for types ${typeA} and ${typeB}`);
	}

	if (
		(isSubtypeOf(typeA, 'xs:dateTime') && isSubtypeOf(typeB, 'xs:yearMonthDuration')) ||
		(isSubtypeOf(typeA, 'xs:dateTime') && isSubtypeOf(typeB, 'xs:dayTimeDuration'))
	) {
		if (operator === 'addOp') {
			return (a, b) => {
				const { castA, castB } = applyCastFunctions(a, b);
				return createAtomicValue(
					addDurationToDateTime(castA.value, castB.value),
					'xs:dateTime'
				);
			};
		}
		if (operator === 'subtractOp') {
			return (a, b) => {
				const { castA, castB } = applyCastFunctions(a, b);
				return createAtomicValue(
					subtractDurationFromDateTime(castA.value, castB.value),
					'xs:dateTime'
				);
			};
		}
	}

	if (
		(isSubtypeOf(typeA, 'xs:date') && isSubtypeOf(typeB, 'xs:yearMonthDuration')) ||
		(isSubtypeOf(typeA, 'xs:date') && isSubtypeOf(typeB, 'xs:dayTimeDuration'))
	) {
		if (operator === 'addOp') {
			return (a, b) => {
				const { castA, castB } = applyCastFunctions(a, b);
				return createAtomicValue(
					addDurationToDateTime(castA.value, castB.value),
					'xs:date'
				);
			};
		}
		if (operator === 'subtractOp') {
			return (a, b) => {
				const { castA, castB } = applyCastFunctions(a, b);
				return createAtomicValue(
					subtractDurationFromDateTime(castA.value, castB.value),
					'xs:date'
				);
			};
		}
	}

	if (isSubtypeOf(typeA, 'xs:time') && isSubtypeOf(typeB, 'xs:dayTimeDuration')) {
		if (operator === 'addOp') {
			return (a, b) => {
				const { castA, castB } = applyCastFunctions(a, b);
				return createAtomicValue(
					addDurationToDateTime(castA.value, castB.value),
					'xs:time'
				);
			};
		}
		if (operator === 'subtractOp') {
			return (a, b) => {
				const { castA, castB } = applyCastFunctions(a, b);
				return createAtomicValue(
					subtractDurationFromDateTime(castA.value, castB.value),
					'xs:time'
				);
			};
		}
	}

	if (
		(isSubtypeOf(typeB, 'xs:yearMonthDuration') && isSubtypeOf(typeA, 'xs:dateTime')) ||
		(isSubtypeOf(typeB, 'xs:dayTimeDuration') && isSubtypeOf(typeA, 'xs:dateTime'))
	) {
		if (operator === 'addOp') {
			return (a, b) => {
				const { castA, castB } = applyCastFunctions(a, b);
				return createAtomicValue(
					addDurationToDateTime(castB.value, castA.value),
					'xs:dateTime'
				);
			};
		}
		if (operator === 'subtractOp') {
			return (a, b) => {
				const { castA, castB } = applyCastFunctions(a, b);
				return createAtomicValue(
					subtractDurationFromDateTime(castB.value, castA.value),
					'xs:dateTime'
				);
			};
		}
	}

	if (
		(isSubtypeOf(typeB, 'xs:dayTimeDuration') && isSubtypeOf(typeA, 'xs:date')) ||
		(isSubtypeOf(typeB, 'xs:yearMonthDuration') && isSubtypeOf(typeA, 'xs:date'))
	) {
		if (operator === 'addOp') {
			return (a, b) => {
				const { castA, castB } = applyCastFunctions(a, b);
				return createAtomicValue(
					addDurationToDateTime(castB.value, castA.value),
					'xs:date'
				);
			};
		}
		if (operator === 'subtractOp') {
			return (a, b) => {
				const { castA, castB } = applyCastFunctions(a, b);
				return createAtomicValue(
					subtractDurationFromDateTime(castB.value, castA.value),
					'xs:date'
				);
			};
		}
	}

	if (isSubtypeOf(typeB, 'xs:dayTimeDuration') && isSubtypeOf(typeA, 'xs:time')) {
		if (operator === 'addOp') {
			return (a, b) => {
				const { castA, castB } = applyCastFunctions(a, b);
				return createAtomicValue(
					addDurationToDateTime(castB.value, castA.value),
					'xs:time'
				);
			};
		}
		if (operator === 'subtractOp') {
			return (a, b) => {
				const { castA, castB } = applyCastFunctions(a, b);
				return createAtomicValue(
					subtractDurationFromDateTime(castB.value, castA.value),
					'xs:time'
				);
			};
		}
	}

	throw new Error(`XPTY0004: ${operator} not available for types ${typeA} and ${typeB}`);
}

const operatorsByTypingKey = Object.create(null);

class BinaryOperator extends Expression {
	private _firstValueExpr: Expression;
	private _operator: string;
	private _secondValueExpr: Expression;

	/**
	 * @param  operator         One of addOp, substractOp, multiplyOp, divOp, idivOp, modOp
	 * @param  firstValueExpr   The selector evaluating to the first value to process
	 * @param  secondValueExpr  The selector evaluating to the second value to process
	 */
	constructor(operator: string, firstValueExpr: Expression, secondValueExpr: Expression) {
		super(
			firstValueExpr.specificity.add(secondValueExpr.specificity),
			[firstValueExpr, secondValueExpr],
			{
				canBeStaticallyEvaluated: false,
			}
		);
		this._firstValueExpr = firstValueExpr;
		this._secondValueExpr = secondValueExpr;

		this._operator = operator;
	}

	public evaluate(dynamicContext, executionParameters) {
		const firstValueSequence = atomize(
			this._firstValueExpr.evaluateMaybeStatically(dynamicContext, executionParameters),
			executionParameters
		);
		return firstValueSequence.mapAll((firstValues) => {
			if (firstValues.length === 0) {
				// Shortcut, if the first part is empty, we can return empty.
				// As per spec, we do not have to evaluate the second part, though we could.
				return sequenceFactory.empty();
			}
			const secondValueSequence = atomize(
				this._secondValueExpr.evaluateMaybeStatically(dynamicContext, executionParameters),
				executionParameters
			);
			return secondValueSequence.mapAll((secondValues) => {
				if (secondValues.length === 0) {
					return sequenceFactory.empty();
				}

				if (firstValues.length > 1 || secondValues.length > 1) {
					throw new Error(
						'XPTY0004: the operands of the "' +
							this._operator +
							'" operator should be empty or singleton.'
					);
				}

				const firstValue = firstValues[0];
				const secondValue = secondValues[0];
				const typingKey = `${firstValue.type}~${secondValue.type}~${this._operator}`;
				let prefabOperator = operatorsByTypingKey[typingKey];
				if (!prefabOperator) {
					prefabOperator = operatorsByTypingKey[
						typingKey
					] = generateBinaryOperatorFunction(
						this._operator,
						firstValue.type,
						secondValue.type
					);
				}

				return sequenceFactory.singleton(prefabOperator(firstValue, secondValue));
			});
		});
	}
}

export default BinaryOperator;
