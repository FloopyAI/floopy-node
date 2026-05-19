/**
 * Batches API types. The gateway forwards batch traffic verbatim to the
 * resolved provider, so these mirror the OpenAI batch shapes with an open
 * index signature for provider-specific extras (no wire mapping).
 */

export interface BatchRequestCounts {
  total?: number;
  completed?: number;
  failed?: number;
  [key: string]: unknown;
}

export interface Batch {
  id: string;
  object?: string;
  endpoint?: string;
  status?: string;
  input_file_id?: string;
  output_file_id?: string | null;
  error_file_id?: string | null;
  created_at?: number;
  completed_at?: number | null;
  request_counts?: BatchRequestCounts;
  metadata?: Record<string, string> | null;
  [key: string]: unknown;
}

export interface BatchList {
  object?: string;
  data: Batch[];
  has_more?: boolean;
  first_id?: string | null;
  last_id?: string | null;
  [key: string]: unknown;
}

export interface BatchCreateParams {
  input_file_id: string;
  endpoint: string;
  completion_window: string;
  metadata?: Record<string, string>;
}

export interface BatchListParams {
  limit?: number;
  after?: string;
}
