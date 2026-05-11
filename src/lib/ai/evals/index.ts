/**
 * AI Resume Optimization — Eval System
 *
 * Test cases, evaluation rules, and bad-output examples
 * for prompt regression testing and quality evaluation.
 */

export { testCases } from "./test-cases"
export type { TestCase } from "./test-cases"

export { evaluationDimensions, checkBlacklist, calculateResult, BLACKLIST } from "./evaluation-rules"
export type { EvaluationDimension, EvalScore, EvalResult } from "./evaluation-rules"

export { badOutputExamples } from "./bad-output-examples"
export type { BadOutputExample, BadOutputCategory } from "./bad-output-examples"
