import { describe, expect, it } from "vitest";

import { FLOOPY_HEADERS } from "../src/constants/headers.js";
import { buildFloopyHeaders, mergeHeaders } from "../src/headers.js";

describe("buildFloopyHeaders", () => {
  it("returns empty when no options provided", () => {
    expect(buildFloopyHeaders(undefined)).toEqual({});
    expect(buildFloopyHeaders({})).toEqual({});
  });

  it("maps cache options to Floopy headers", () => {
    const headers = buildFloopyHeaders({ cache: { enabled: true, bucketMaxSize: 5 } });
    expect(headers[FLOOPY_HEADERS.CACHE_ENABLED]).toBe("true");
    expect(headers[FLOOPY_HEADERS.CACHE_BUCKET_MAX_SIZE]).toBe("5");
  });

  it("maps prompt id and version", () => {
    const headers = buildFloopyHeaders({ promptId: "abc-123", promptVersion: "2" });
    expect(headers[FLOOPY_HEADERS.PROMPT_ID]).toBe("abc-123");
    expect(headers[FLOOPY_HEADERS.PROMPT_VERSION]).toBe("2");
  });

  it("maps llmSecurityEnabled", () => {
    expect(buildFloopyHeaders({ llmSecurityEnabled: true })[FLOOPY_HEADERS.LLM_SECURITY_ENABLED]).toBe(
      "true",
    );
    expect(buildFloopyHeaders({ llmSecurityEnabled: false })[FLOOPY_HEADERS.LLM_SECURITY_ENABLED]).toBe(
      "false",
    );
  });

  it("does not emit headers for unset fields", () => {
    expect(buildFloopyHeaders({ cache: {} })).toEqual({});
  });
});

describe("mergeHeaders", () => {
  it("merges layers with later layers taking precedence", () => {
    const merged = mergeHeaders({ a: "1", b: "1" }, { b: "2", c: "3" });
    expect(merged).toEqual({ a: "1", b: "2", c: "3" });
  });

  it("ignores undefined layers", () => {
    expect(mergeHeaders({ a: "1" }, undefined, { b: "2" })).toEqual({ a: "1", b: "2" });
  });
});
