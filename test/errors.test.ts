import { describe, expect, it } from "vitest";

import {
  FloopyAuthError,
  FloopyConflictError,
  FloopyNotFoundError,
  FloopyPlanError,
  FloopyRateLimitError,
  FloopyServerError,
  FloopyValidationError,
  errorFromStatus,
} from "../src/errors.js";

describe("errorFromStatus", () => {
  it("maps 400 → FloopyValidationError", () => {
    const err = errorFromStatus({
      status: 400,
      body: { error: { code: "bad", message: "missing field" } },
      requestId: "req_1",
    });
    expect(err).toBeInstanceOf(FloopyValidationError);
    expect(err.message).toBe("missing field");
    expect(err.code).toBe("bad");
    expect(err.requestId).toBe("req_1");
  });

  it("maps 401 → FloopyAuthError", () => {
    const err = errorFromStatus({ status: 401, body: undefined, requestId: undefined });
    expect(err).toBeInstanceOf(FloopyAuthError);
  });

  it("maps 403 with feature → FloopyPlanError", () => {
    const err = errorFromStatus({
      status: 403,
      body: { error: { feature: "audit_api", message: "Plan does not allow audit_api" } },
      requestId: undefined,
    });
    expect(err).toBeInstanceOf(FloopyPlanError);
    expect((err as FloopyPlanError).feature).toBe("audit_api");
  });

  it("maps 403 without feature → FloopyAuthError", () => {
    const err = errorFromStatus({ status: 403, body: undefined, requestId: undefined });
    expect(err).toBeInstanceOf(FloopyAuthError);
  });

  it("maps 404 → FloopyNotFoundError", () => {
    expect(errorFromStatus({ status: 404, body: undefined, requestId: undefined })).toBeInstanceOf(
      FloopyNotFoundError,
    );
  });

  it("maps 409 → FloopyConflictError", () => {
    expect(errorFromStatus({ status: 409, body: undefined, requestId: undefined })).toBeInstanceOf(
      FloopyConflictError,
    );
  });

  it("maps 429 → FloopyRateLimitError", () => {
    expect(errorFromStatus({ status: 429, body: undefined, requestId: undefined })).toBeInstanceOf(
      FloopyRateLimitError,
    );
  });

  it("maps 5xx → FloopyServerError", () => {
    expect(errorFromStatus({ status: 503, body: undefined, requestId: undefined })).toBeInstanceOf(
      FloopyServerError,
    );
  });
});
