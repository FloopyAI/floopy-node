export { Floopy } from "./client.js";
export {
  FloopyError,
  FloopyAuthError,
  FloopyPlanError,
  FloopyRateLimitError,
  FloopyValidationError,
  FloopyNotFoundError,
  FloopyConflictError,
  FloopyServerError,
  FloopyTimeoutError,
  FloopyConnectionError,
} from "./errors.js";
export { FLOOPY_HEADERS, FLOOPY_CONFIRM_VALUES } from "./constants/headers.js";
export { DEFAULT_BASE_URL } from "./constants/defaults.js";
export type {
  FloopyClientOptions,
  FloopyOptions,
  RequestOptions,
  PaginatedResponse,
} from "./types/shared.js";

// Floopy-only resource types
export type {
  FeedbackSubmitParams,
  FeedbackSubmitResponse,
} from "./types/feedback.js";
export type {
  Decision,
  DecisionListPage,
  DecisionListParams,
} from "./types/decisions.js";
export type {
  Experiment,
  ExperimentCreateParams,
  ExperimentListPage,
  ExperimentListParams,
  ExperimentResults,
  ExperimentStatus,
  VariantResults,
} from "./types/experiments.js";
export type { OrgConstraints } from "./types/constraints.js";
export type {
  ExportDecisionsParams,
  ExportFormat,
  ExportTrailer,
  ExportedDecisionRow,
} from "./types/export.js";
export type {
  EvaluationCreateParams,
  EvaluationResultRow,
  EvaluationResultsPage,
  EvaluationResultsParams,
  EvaluationRun,
  EvaluationStatus,
} from "./types/evaluations.js";
export type { RoutingExplainParams, RoutingExplainResult } from "./types/routing.js";
export type { Session, SessionTurn } from "./types/sessions.js";
export type {
  FileObject,
  FileList,
  FileUploadParams,
  FileListParams,
} from "./types/files.js";
export type {
  Batch,
  BatchList,
  BatchCreateParams,
  BatchListParams,
  BatchRequestCounts,
} from "./types/batches.js";
export type { BatchRequestOptions } from "./resources/batch-options.js";

// Re-export OpenAI types so consumers can `import type { ChatCompletion } from "floopy-sdk"`
// without a separate `openai` import.
export type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParams,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
  ChatCompletionAssistantMessageParam,
  ChatCompletionToolMessageParam,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
} from "openai/resources/chat/completions";
export type { CreateEmbeddingResponse, EmbeddingCreateParams } from "openai/resources/embeddings";
