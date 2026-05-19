import { ENDPOINTS } from "../constants/endpoints.js";
import type { FloopyHttp } from "../http.js";
import type { Batch, BatchCreateParams, BatchList, BatchListParams } from "../types/batches.js";
import { batchInit, type BatchRequestOptions } from "./batch-options.js";

/**
 * Batches API — create/list/retrieve/cancel asynchronous batch jobs.
 * Traffic is forwarded verbatim to the provider selected via the
 * `provider` option (`floopy-provider` header); a batch carries no model
 * up front so the provider cannot be inferred.
 */
export class BatchesResource {
  constructor(private readonly http: FloopyHttp) {}

  /** Create a batch from a previously uploaded input file. */
  async create(
    params: BatchCreateParams,
    options?: BatchRequestOptions,
  ): Promise<Batch> {
    const { data } = await this.http.request<Batch>(
      "POST",
      ENDPOINTS.BATCHES,
      batchInit(options, { body: params }),
    );
    return data;
  }

  /** List batches for the organization. */
  async list(params?: BatchListParams, options?: BatchRequestOptions): Promise<BatchList> {
    const { data } = await this.http.request<BatchList>(
      "GET",
      ENDPOINTS.BATCHES,
      batchInit(options, { query: { limit: params?.limit, after: params?.after } }),
    );
    return data;
  }

  /** Retrieve a single batch (poll its status). */
  async retrieve(id: string, options?: BatchRequestOptions): Promise<Batch> {
    const { data } = await this.http.request<Batch>(
      "GET",
      ENDPOINTS.BATCH_BY_ID(id),
      batchInit(options),
    );
    return data;
  }

  /** Request cancellation of an in-progress batch. */
  async cancel(id: string, options?: BatchRequestOptions): Promise<Batch> {
    const { data } = await this.http.request<Batch>(
      "POST",
      ENDPOINTS.BATCH_CANCEL(id),
      batchInit(options),
    );
    return data;
  }
}
