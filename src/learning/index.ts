export {
  learnCase,
  replayCase,
  guardRepo,
  contextForFiles,
  listCases,
  explainCase,
  renderGuardReportHtml,
} from "./engine.js";

export { FailureCaseSchema, LearningRuleSchema } from "./model.js";
export type {
  ContextInstruction,
  ContextResult,
  FailureCase,
  GuardReport,
  LearningCaseSummary,
  LearningRule,
  ReplayResult,
  ReplayVerification,
  RuleEvaluation,
  StoredLearningCase,
} from "./model.js";
