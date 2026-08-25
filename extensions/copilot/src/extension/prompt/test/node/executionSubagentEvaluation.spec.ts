/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from 'vitest';
import { createExecutionSubagentEvaluationConversation, EXECUTION_SUBAGENT_EVALUATION_ENVIRONMENT_VARIABLE, EXECUTION_SUBAGENT_TURN_WARNING_MODE_ENVIRONMENT_VARIABLE, getExecutionSubagentInstruction, getExecutionSubagentTurnWarning, getExecutionSubagentTurnWarningMode, isExecutionSubagentEvaluationEnabled, isExecutionSubagentTurnWarningExperimentEnabled } from '../../node/executionSubagentEvaluation';

describe('Execution subagent evaluation mode', () => {
	it('is enabled only by the explicit value 1', () => {
		const enabled = {
			[EXECUTION_SUBAGENT_EVALUATION_ENVIRONMENT_VARIABLE]: '1',
		};
		const disabledValues = [undefined, '', '0', 'true'].map(value => ({
			[EXECUTION_SUBAGENT_EVALUATION_ENVIRONMENT_VARIABLE]: value,
		}));

		expect({
			enabled: isExecutionSubagentEvaluationEnabled(enabled),
			disabled: disabledValues.map(isExecutionSubagentEvaluationEnabled),
		}).toEqual({
			enabled: true,
			disabled: [false, false, false, false],
		});
	});

	it('creates a dedicated single-turn execution prompt for each request', () => {
		const first = createExecutionSubagentEvaluationConversation('session-id', 'run npm test');
		const second = createExecutionSubagentEvaluationConversation('session-id', 'run npm run lint');

		expect([
			{
				sessionId: first.sessionId,
				turns: first.turns.map(turn => turn.request.message),
			},
			{
				sessionId: second.sessionId,
				turns: second.turns.map(turn => turn.request.message),
			},
		]).toEqual([
			{
				sessionId: 'session-id',
				turns: [getExecutionSubagentInstruction('run npm test')],
			},
			{
				sessionId: 'session-id',
				turns: [getExecutionSubagentInstruction('run npm run lint')],
			},
		]);
	});

	it('preserves the final-turn-only warning by default', () => {
		expect({
			mode: getExecutionSubagentTurnWarningMode({}),
			first: getExecutionSubagentTurnWarning(10, 0, 'last'),
			final: getExecutionSubagentTurnWarning(10, 9, 'last'),
		}).toEqual({
			mode: 'last',
			first: undefined,
			final: 'OK, your allotted iterations are finished. Show the <final_answer>.',
		});
	});

	it('renders the remaining-turn warning on every turn', () => {
		const environment = {
			[EXECUTION_SUBAGENT_TURN_WARNING_MODE_ENVIRONMENT_VARIABLE]: 'every',
		};

		expect({
			mode: getExecutionSubagentTurnWarningMode(environment),
			first: getExecutionSubagentTurnWarning(10, 0, 'every'),
			second: getExecutionSubagentTurnWarning(10, 1, 'every'),
			final: getExecutionSubagentTurnWarning(10, 9, 'every'),
		}).toEqual({
			mode: 'every',
			first: 'You have 10 of 10 allotted iterations remaining. When one iteration remains, do not call tools; return only the <final_answer>.',
			second: 'You have 9 of 10 allotted iterations remaining. When one iteration remains, do not call tools; return only the <final_answer>.',
			final: 'You have 1 of 10 allotted iterations remaining. When one iteration remains, do not call tools; return only the <final_answer>.',
		});
	});

	it('enables strict model resolution only for explicit treatment modes', () => {
		expect({
			last: isExecutionSubagentTurnWarningExperimentEnabled({
				[EXECUTION_SUBAGENT_TURN_WARNING_MODE_ENVIRONMENT_VARIABLE]: 'last',
			}),
			every: isExecutionSubagentTurnWarningExperimentEnabled({
				[EXECUTION_SUBAGENT_TURN_WARNING_MODE_ENVIRONMENT_VARIABLE]: 'every',
			}),
			unset: isExecutionSubagentTurnWarningExperimentEnabled({}),
			invalid: isExecutionSubagentTurnWarningExperimentEnabled({
				[EXECUTION_SUBAGENT_TURN_WARNING_MODE_ENVIRONMENT_VARIABLE]: 'always',
			}),
		}).toEqual({
			last: true,
			every: true,
			unset: false,
			invalid: false,
		});
	});
});
