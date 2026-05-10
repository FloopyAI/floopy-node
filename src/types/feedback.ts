export interface FeedbackSubmitParams {
  /** NPS-style score 0..10. */
  score: number;
  /** Did the response solve the user's need? */
  useful: boolean;
  /** Session id (request_id from the originating chat completion). */
  sessionId?: string;
}

export interface FeedbackSubmitResponse {
  duplicate: boolean;
  sessionId: string | undefined;
}
