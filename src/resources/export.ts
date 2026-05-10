import { ENDPOINTS } from "../constants/endpoints.js";
import { FloopyError } from "../errors.js";
import type { FloopyHttp } from "../http.js";
import type { RequestOptions } from "../types/shared.js";
import type {
  ExportDecisionsParams,
  ExportTrailer,
  ExportedDecisionRow,
} from "../types/export.js";

interface ExportRowWire {
  request_id: string;
  session_id: string | null;
  organization_id: string;
  provider: string | null;
  model: string | null;
  status: string;
  latency_ms: number | null;
  cost_micro_usd: number | null;
  cache_enabled: boolean | null;
  threat: string | null;
  created_at: string;
  trailer?: undefined;
}

interface ExportTrailerWire {
  trailer: true;
  rows_emitted: number;
  truncated: boolean;
  reason: string | null;
}

type ExportLine = ExportRowWire | ExportTrailerWire;

function mapRow(w: ExportRowWire): ExportedDecisionRow {
  return {
    requestId: w.request_id,
    sessionId: w.session_id,
    organizationId: w.organization_id,
    provider: w.provider,
    model: w.model,
    status: w.status,
    latencyMs: w.latency_ms,
    costMicroUsd: w.cost_micro_usd,
    cacheEnabled: w.cache_enabled,
    threat: w.threat,
    createdAt: w.created_at,
  };
}

function mapTrailer(w: ExportTrailerWire): ExportTrailer {
  return {
    trailer: true,
    rowsEmitted: w.rows_emitted,
    truncated: w.truncated,
    reason: w.reason,
  };
}

export class ExportResource {
  constructor(private readonly http: FloopyHttp) {}

  /**
   * Async iterator over the JSONL export stream. The terminal trailer
   * record is **not** yielded as a row — read `trailer` after iteration
   * completes via {@link decisionsWithTrailer}.
   */
  async *decisions(
    params: ExportDecisionsParams,
    requestOptions?: RequestOptions,
  ): AsyncGenerator<ExportedDecisionRow, void, void> {
    for await (const line of this.streamLines(params, requestOptions)) {
      if (line.trailer === true) continue;
      yield mapRow(line);
    }
  }

  /**
   * Like {@link decisions} but also returns the trailer summary at the
   * end. The trailer is non-null after the iterator completes normally.
   */
  decisionsWithTrailer(
    params: ExportDecisionsParams,
    requestOptions?: RequestOptions,
  ): {
    rows: AsyncGenerator<ExportedDecisionRow, void, void>;
    trailer: { value: ExportTrailer | null };
  } {
    const trailer: { value: ExportTrailer | null } = { value: null };
    const self = this;
    async function* gen(): AsyncGenerator<ExportedDecisionRow, void, void> {
      for await (const line of self.streamLines(params, requestOptions)) {
        if (line.trailer === true) {
          trailer.value = mapTrailer(line);
          continue;
        }
        yield mapRow(line);
      }
    }
    return { rows: gen(), trailer };
  }

  private async *streamLines(
    params: ExportDecisionsParams,
    requestOptions: RequestOptions | undefined,
  ): AsyncGenerator<ExportLine, void, void> {
    const query: Record<string, string | number | undefined> = {
      from: params.from,
      to: params.to,
    };
    if (params.format !== undefined) query.format = params.format;
    const opts: { query: typeof query; requestOptions?: RequestOptions } = { query };
    if (requestOptions !== undefined) opts.requestOptions = requestOptions;
    const response = await this.http.requestRaw("GET", ENDPOINTS.EXPORT_DECISIONS, opts);
    if (response.body === null) {
      throw new FloopyError("Export response had no body", { status: response.status });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex = buffer.indexOf("\n");
        while (newlineIndex !== -1) {
          const rawLine = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (rawLine.length > 0) {
            yield JSON.parse(rawLine) as ExportLine;
          }
          newlineIndex = buffer.indexOf("\n");
        }
      }
      buffer += decoder.decode();
      const tail = buffer.trim();
      if (tail.length > 0) yield JSON.parse(tail) as ExportLine;
    } finally {
      reader.releaseLock();
    }
  }
}
