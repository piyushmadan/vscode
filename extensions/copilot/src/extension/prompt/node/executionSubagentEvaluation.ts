/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { generateUuid } from '../../../util/vs/base/common/uuid';
import { Conversation, Turn } from '../common/conversation';

export const EXECUTION_SUBAGENT_EVALUATION_ENVIRONMENT_VARIABLE = 'VSCODE_COPILOT_EXECUTION_SUBAGENT_EVAL';
export const EXECUTION_SUBAGENT_EVALUATION_TOOL_CALL_LIMIT = 10;
export const EXECUTION_SUBAGENT_TURN_WARNING_MODE_ENVIRONMENT_VARIABLE = 'VSCODE_COPILOT_EXECUTION_SUBAGENT_TURN_WARNING_MODE';

export type ExecutionSubagentTurnWarningMode = 'last' | 'every';

export function isExecutionSubagentEvaluationEnabled(environment: Readonly<Record<string, string | undefined>> = process.env): boolean {
	return environment[EXECUTION_SUBAGENT_EVALUATION_ENVIRONMENT_VARIABLE] === '1';
}

export function getExecutionSubagentTurnWarningMode(environment: Readonly<Record<string, string | undefined>> = process.env): ExecutionSubagentTurnWarningMode {
	return environment[EXECUTION_SUBAGENT_TURN_WARNING_MODE_ENVIRONMENT_VARIABLE] === 'every' ? 'every' : 'last';
}

export function isExecutionSubagentTurnWarningExperimentEnabled(environment: Readonly<Record<string, string | undefined>> = process.env): boolean {
	const mode = environment[EXECUTION_SUBAGENT_TURN_WARNING_MODE_ENVIRONMENT_VARIABLE];
	return mode === 'last' || mode === 'every';
}

export function getExecutionSubagentTurnWarning(maxTurns: number, completedTurns: number, mode: ExecutionSubagentTurnWarningMode): string | undefined {
	const remainingTurns = Math.max(maxTurns - completedTurns, 1);
	if (mode === 'every') {
		return `You have ${remainingTurns} of ${maxTurns} allotted iterations remaining. When one iteration remains, do not call tools; return only the <final_answer>.`;
	}
	return remainingTurns === 1
		? 'OK, your allotted iterations are finished. Show the <final_answer>.'
		: undefined;
}

export function getExecutionSubagentInstruction(prompt: string): string {
	return [
		'Execution query: ',
		`${prompt}`,
		'',
	].join('\n');
}

export function createExecutionSubagentEvaluationConversation(sessionId: string, prompt: string): Conversation {
	return new Conversation(sessionId, [new Turn(generateUuid(), { type: 'user', message: getExecutionSubagentInstruction(prompt) })]);
}
