import OpenAI from "openai";

import { FLOOPY_HEADERS } from "./constants/headers.js";
import { DEFAULT_USER_AGENT_PREFIX } from "./constants/defaults.js";
import { buildFloopyHeaders, mergeHeaders } from "./headers.js";
import type { FloopyHttp } from "./http.js";
import { SDK_VERSION } from "./version.js";

export function createOpenAIDelegate(http: FloopyHttp): OpenAI {
  const baseURL = http.getBaseURL();
  const apiKey = http.getApiKey();
  const floopyHeaders = mergeHeaders(buildFloopyHeaders(undefined), http.getDefaultRequestHeaders());
  // Strip headers that the OpenAI SDK already manages.
  delete floopyHeaders[FLOOPY_HEADERS.AUTHORIZATION];
  delete floopyHeaders[FLOOPY_HEADERS.CONTENT_TYPE];
  delete floopyHeaders[FLOOPY_HEADERS.USER_AGENT];
  return new OpenAI({
    apiKey,
    baseURL,
    defaultHeaders: {
      ...floopyHeaders,
      "X-Floopy-SDK": `${DEFAULT_USER_AGENT_PREFIX}/${SDK_VERSION}`,
    },
  });
}
