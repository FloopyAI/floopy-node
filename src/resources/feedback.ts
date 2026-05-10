import { ENDPOINTS } from "../constants/endpoints.js";
import type { FloopyHttp } from "../http.js";
import type { RequestOptions } from "../types/shared.js";
import type {
  FeedbackSubmitParams,
  FeedbackSubmitResponse,
} from "../types/feedback.js";

interface FeedbackWireResponse {
  duplicate: boolean;
  session_id?: string | null;
}

export class FeedbackResource {
  constructor(private readonly http: FloopyHttp) {}

  async submit(
    params: FeedbackSubmitParams,
    requestOptions?: RequestOptions,
  ): Promise<FeedbackSubmitResponse> {
    const body = {
      score: params.score,
      useful: params.useful,
      ...(params.sessionId !== undefined ? { session_id: params.sessionId } : {}),
    };
    const opts: { body: unknown; requestOptions?: RequestOptions } = { body };
    if (requestOptions !== undefined) opts.requestOptions = requestOptions;
    const { data } = await this.http.request<FeedbackWireResponse>(
      "POST",
      ENDPOINTS.FEEDBACK,
      opts,
    );
    return {
      duplicate: data.duplicate,
      sessionId: data.session_id ?? undefined,
    };
  }
}
