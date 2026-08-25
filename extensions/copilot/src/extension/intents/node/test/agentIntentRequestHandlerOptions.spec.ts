/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, test } from 'vitest';
import { ChatLocation } from '../../../../platform/chat/common/commonTypes';
import { EXECUTION_SUBAGENT_EVALUATION_ENVIRONMENT_VARIABLE, EXECUTION_SUBAGENT_EVALUATION_TOOL_CALL_LIMIT } from '../../../prompt/node/executionSubagentEvaluation';
import { TestChatRequest } from '../../../test/node/testHelpers';
import { getAgentIntentRequestHandlerOptions } from '../agentIntent';

describe('getAgentIntentRequestHandlerOptions', () => {
	test('keeps the normal agent loop when evaluation mode is disabled', () => {
		const request = new TestChatRequest('run the tests');

		expect(getAgentIntentRequestHandlerOptions(request, 14, 0.3, {})).toEqual({
			maxToolCallIterations: 14,
			temperature: 0.3,
			overrideRequestLocation: ChatLocation.Agent,
		});
	});

	test('routes top-level agent requests through the execution subagent evaluation loop', () => {
		const request = new TestChatRequest('run the tests');

		expect(getAgentIntentRequestHandlerOptions(request, 14, 0.3, {
			[EXECUTION_SUBAGENT_EVALUATION_ENVIRONMENT_VARIABLE]: '1',
		})).toEqual({
			maxToolCallIterations: EXECUTION_SUBAGENT_EVALUATION_TOOL_CALL_LIMIT,
			temperature: 0.3,
			overrideRequestLocation: ChatLocation.Agent,
			executionSubagentEvaluation: true,
		});
	});

	test('does not route subagent turns through the evaluation loop', () => {
		const request = {
			...new TestChatRequest('run the tests'),
			subAgentInvocationId: 'subagent-turn',
			subAgentName: 'execution',
		};

		expect(getAgentIntentRequestHandlerOptions(request, 14, 0.3, {
			[EXECUTION_SUBAGENT_EVALUATION_ENVIRONMENT_VARIABLE]: '1',
		})).toEqual({
			maxToolCallIterations: 14,
			temperature: 0.3,
			overrideRequestLocation: ChatLocation.Agent,
		});
	});
});
