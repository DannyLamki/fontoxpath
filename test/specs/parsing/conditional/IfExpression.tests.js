define([
	'slimdom',
	'fontoxml-blueprints/readOnlyBlueprint',
	'fontoxml-selectors/evaluateXPathToBoolean'
], function (
	slimdom,
	readOnlyBlueprint,
	evaluateXPathToBoolean
) {
	'use strict';

	describe('IfExpression', function () {
		var documentNode;
		beforeEach(function () {
			documentNode = slimdom.createDocument();
		});

		it('returns the value of the then expression if the test resolves to true', function () {
			chai.assert(evaluateXPathToBoolean(
				'(if (true()) then "then expression" else "else expression") eq "then expression"',
				documentNode,
				readOnlyBlueprint));
		});

		it('returns the value of the then expression if the test resolves to false', function () {
			chai.assert(evaluateXPathToBoolean(
				'(if (false()) then "then expression" else "else expression") eq "else expression"',
				documentNode,
				readOnlyBlueprint));
		});
	});
});
