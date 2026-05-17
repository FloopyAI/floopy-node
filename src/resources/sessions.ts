import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { ENDPOINTS } from "../constants/endpoints.js";
import type { FloopyHttp } from "../http.js";
import type { RequestOptions } from "../types/shared.js";
import type { Session, SessionTurn } from "../types/sessions.js";

interface SessionTurnWire {
  request_id: string;
  created_at: string;
  model: string;
  provider: string;
}

interface SessionWire {
  session_id: string;
  messages: ChatCompletionMessageParam[];
  turn_count: number;
  turns: SessionTurnWire[];
}

function mapTurn(w: SessionTurnWire): SessionTurn {
  return {
    requestId: w.request_id,
    createdAt: w.created_at,
    model: w.model,
    provider: w.provider,
  };
}

function mapSession(w: SessionWire): Session {
  return {
    sessionId: w.session_id,
    messages: w.messages,
    turnCount: w.turn_count,
    turns: w.turns.map(mapTurn),
  };
}

export class SessionsResource {
  constructor(private readonly http: FloopyHttp) {}

  /**
   * Restore a stored conversation by its `session_id` (the value your
   * client sent on the `floopy-session-id` header at request time).
   * Scoped to the organization that owns the API key. The returned
   * `messages` array is a drop-in for a follow-up chat completion, so you
   * never have to persist conversation history yourself.
   */
  async get(sessionId: string, requestOptions?: RequestOptions): Promise<Session> {
    const opts: { requestOptions?: RequestOptions } = {};
    if (requestOptions !== undefined) opts.requestOptions = requestOptions;
    const { data } = await this.http.request<SessionWire>(
      "GET",
      ENDPOINTS.SESSION_BY_ID(sessionId),
      opts,
    );
    return mapSession(data);
  }
}
