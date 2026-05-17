import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

/** Provenance for one reconstructed exchange. */
export interface SessionTurn {
  requestId: string;
  /** RFC3339 timestamp of the originating request. */
  createdAt: string;
  model: string;
  provider: string;
}

/**
 * A conversation restored from Floopy's stored logs. `messages` is
 * chronological (oldest -> newest) and is a drop-in for the `messages`
 * field of a follow-up `chat.completions.create` call.
 */
export interface Session {
  sessionId: string;
  messages: ChatCompletionMessageParam[];
  /** Stored turns that contributed to `messages`. */
  turnCount: number;
  turns: SessionTurn[];
}
