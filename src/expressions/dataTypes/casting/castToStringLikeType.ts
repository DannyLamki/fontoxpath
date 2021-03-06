import { ValueType } from '../Value';
import QName from '../valueTypes/QName';

export default function castToStringLikeType(
	instanceOf: (t: ValueType) => boolean
): (value: any) => { successful: true; value: any } | { error: Error; successful: false } {
	if (instanceOf('xs:string') || instanceOf('xs:untypedAtomic')) {
		return (value) => ({
			successful: true,
			value: value + '',
		});
	}
	if (instanceOf('xs:anyURI')) {
		return (value) => ({
			successful: true,
			value,
		});
	}
	if (instanceOf('xs:QName')) {
		return (value: QName) => {
			return {
				successful: true,
				value: value.prefix ? `${value.prefix}:${value.localName}` : value.localName,
			};
		};
	}
	if (instanceOf('xs:NOTATION')) {
		return (value) => ({
			successful: true,
			value: value.toString(),
		});
	}
	if (instanceOf('xs:numeric')) {
		if (instanceOf('xs:integer') || instanceOf('xs:decimal')) {
			return (value) => ({
				successful: true,
				value: (value + '').replace('e', 'E'),
			});
		}
		if (instanceOf('xs:float') || instanceOf('xs:double')) {
			return (value) => {
				if (isNaN(value)) {
					return {
						successful: true,
						value: 'NaN',
					};
				}
				if (!isFinite(value)) {
					return {
						successful: true,
						value: `${value < 0 ? '-' : ''}INF`,
					};
				}
				if (Object.is(value, -0)) {
					return {
						successful: true,
						value: '-0',
					};
				}
				// Use Javascript's built in number formatting. This outputs like 1e+100. The valid XPath version is
				// 1E100: without the +, and with the exponent in capitals
				return {
					successful: true,
					value: (value + '').replace('e', 'E').replace('E+', 'E'),
				};
			};
		}
	}
	if (
		instanceOf('xs:dateTime') ||
		instanceOf('xs:date') ||
		instanceOf('xs:time') ||
		instanceOf('xs:gDay') ||
		instanceOf('xs:gMonth') ||
		instanceOf('xs:gMonthDay') ||
		instanceOf('xs:gYear') ||
		instanceOf('xs:gYearMonth')
	) {
		return (value) => ({
			successful: true,
			value: value.toString(),
		});
	}
	if (instanceOf('xs:yearMonthDuration')) {
		return (value) => ({
			successful: true,
			value: value.toString(),
		});
	}
	if (instanceOf('xs:dayTimeDuration')) {
		return (value) => ({
			successful: true,
			value: value.toString(),
		});
	}
	if (instanceOf('xs:duration')) {
		return (value) => ({
			successful: true,
			value: value.toString(),
		});
	}
	if (instanceOf('xs:hexBinary')) {
		return (value) => ({
			successful: true,
			value: value.toUpperCase(),
		});
	}
	return (value) => ({
		successful: true,
		value: value + '',
	});
}
