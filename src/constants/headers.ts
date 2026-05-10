export const FLOOPY_HEADERS = {
  CACHE_ENABLED: "Floopy-Cache-Enabled",
  CACHE_BUCKET_MAX_SIZE: "Floopy-Cache-Bucket-Max-Size",
  PROMPT_ID: "Floopy-Prompt-Id",
  PROMPT_VERSION: "Floopy-Prompt-Version",
  LLM_SECURITY_ENABLED: "floopy-llm-security-enabled",
  CONFIRM: "X-Floopy-Confirm",
  REQUEST_ID: "X-Request-Id",
  AUTHORIZATION: "Authorization",
  CONTENT_TYPE: "Content-Type",
  USER_AGENT: "User-Agent",
} as const;

export type FloopyHeaderName = (typeof FLOOPY_HEADERS)[keyof typeof FLOOPY_HEADERS];

export const FLOOPY_CONFIRM_VALUES = {
  EXPERIMENTS: "experiments",
} as const;
