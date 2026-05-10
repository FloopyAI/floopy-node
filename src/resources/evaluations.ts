import { ENDPOINTS } from "../constants/endpoints.js";
import type { FloopyHttp } from "../http.js";
import type { RequestOptions } from "../types/shared.js";
import type {
  EvaluationCreateParams,
  EvaluationResultRow,
  EvaluationResultsPage,
  EvaluationResultsParams,
  EvaluationRun,
  EvaluationStatus,
} from "../types/evaluations.js";

interface EvaluationRunWire {
  id: string;
  dataset_id: string;
  model: string;
  prompt_id: string | null;
  status: EvaluationStatus;
  config: Record<string, unknown> | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

interface EvaluationResultWire {
  id: string;
  run_id: string;
  input_id: string;
  output: string;
  score: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface EvaluationResultsPageWire {
  items: EvaluationResultWire[];
  next_cursor: string | null;
  has_more: boolean;
}

function mapRun(w: EvaluationRunWire): EvaluationRun {
  return {
    id: w.id,
    datasetId: w.dataset_id,
    model: w.model,
    promptId: w.prompt_id,
    status: w.status,
    config: w.config,
    createdAt: w.created_at,
    startedAt: w.started_at,
    finishedAt: w.finished_at,
  };
}

function mapResult(w: EvaluationResultWire): EvaluationResultRow {
  return {
    id: w.id,
    runId: w.run_id,
    inputId: w.input_id,
    output: w.output,
    score: w.score,
    metadata: w.metadata,
    createdAt: w.created_at,
  };
}

export class EvaluationsResource {
  constructor(private readonly http: FloopyHttp) {}

  async create(
    params: EvaluationCreateParams,
    requestOptions?: RequestOptions,
  ): Promise<EvaluationRun> {
    const body: Record<string, unknown> = {
      dataset_id: params.datasetId,
      model: params.model,
    };
    if (params.promptId !== undefined) body.prompt_id = params.promptId;
    if (params.config !== undefined) body.config = params.config;
    const opts: { body: unknown; requestOptions?: RequestOptions } = { body };
    if (requestOptions !== undefined) opts.requestOptions = requestOptions;
    const { data } = await this.http.request<EvaluationRunWire>(
      "POST",
      ENDPOINTS.EVALUATIONS,
      opts,
    );
    return mapRun(data);
  }

  async get(id: string, requestOptions?: RequestOptions): Promise<EvaluationRun> {
    const opts: { requestOptions?: RequestOptions } = {};
    if (requestOptions !== undefined) opts.requestOptions = requestOptions;
    const { data } = await this.http.request<EvaluationRunWire>(
      "GET",
      ENDPOINTS.EVALUATION_BY_ID(id),
      opts,
    );
    return mapRun(data);
  }

  async cancel(id: string, requestOptions?: RequestOptions): Promise<EvaluationRun> {
    const opts: { requestOptions?: RequestOptions } = {};
    if (requestOptions !== undefined) opts.requestOptions = requestOptions;
    const { data } = await this.http.request<EvaluationRunWire>(
      "POST",
      ENDPOINTS.EVALUATION_CANCEL(id),
      opts,
    );
    return mapRun(data);
  }

  async results(
    id: string,
    params: EvaluationResultsParams = {},
    requestOptions?: RequestOptions,
  ): Promise<EvaluationResultsPage> {
    const query: Record<string, string | number | undefined> = {};
    if (params.limit !== undefined) query.limit = params.limit;
    if (params.cursor !== undefined) query.cursor = params.cursor;
    const opts: { query: typeof query; requestOptions?: RequestOptions } = { query };
    if (requestOptions !== undefined) opts.requestOptions = requestOptions;
    const { data } = await this.http.request<EvaluationResultsPageWire>(
      "GET",
      ENDPOINTS.EVALUATION_RESULTS(id),
      opts,
    );
    return {
      items: data.items.map(mapResult),
      nextCursor: data.next_cursor,
      hasMore: data.has_more,
    };
  }
}
