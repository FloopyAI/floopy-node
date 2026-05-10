export interface FloopyErrorBody {
  error?: { code?: string; message?: string; feature?: string };
  [key: string]: unknown;
}

export interface FloopyErrorInit {
  status?: number | undefined;
  code?: string | undefined;
  requestId?: string | undefined;
  body?: FloopyErrorBody | string | undefined;
  cause?: unknown;
}

export class FloopyError extends Error {
  readonly status: number | undefined;
  readonly code: string | undefined;
  readonly requestId: string | undefined;
  readonly body: FloopyErrorBody | string | undefined;

  constructor(message: string, init?: FloopyErrorInit) {
    super(message, init?.cause !== undefined ? { cause: init.cause } : undefined);
    this.name = "FloopyError";
    this.status = init?.status;
    this.code = init?.code;
    this.requestId = init?.requestId;
    this.body = init?.body;
  }
}

interface NamedInit extends FloopyErrorInit {
  message?: string | undefined;
}

export class FloopyAuthError extends FloopyError {
  constructor(args: NamedInit) {
    super(args.message ?? "Authentication failed", args);
    this.name = "FloopyAuthError";
  }
}

export class FloopyPlanError extends FloopyError {
  readonly feature: string | undefined;
  constructor(args: NamedInit & { feature?: string | undefined }) {
    super(args.message ?? "Plan does not allow this feature", args);
    this.name = "FloopyPlanError";
    this.feature = args.feature;
  }
}

export class FloopyRateLimitError extends FloopyError {
  retryAfterSeconds: number | undefined;
  constructor(args: NamedInit & { retryAfterSeconds?: number | undefined }) {
    super(args.message ?? "Rate limit exceeded", args);
    this.name = "FloopyRateLimitError";
    this.retryAfterSeconds = args.retryAfterSeconds;
  }
}

export class FloopyValidationError extends FloopyError {
  constructor(args: NamedInit) {
    super(args.message ?? "Invalid request", args);
    this.name = "FloopyValidationError";
  }
}

export class FloopyNotFoundError extends FloopyError {
  constructor(args: NamedInit) {
    super(args.message ?? "Not found", args);
    this.name = "FloopyNotFoundError";
  }
}

export class FloopyConflictError extends FloopyError {
  constructor(args: NamedInit) {
    super(args.message ?? "Conflict", args);
    this.name = "FloopyConflictError";
  }
}

export class FloopyServerError extends FloopyError {
  constructor(args: NamedInit) {
    super(args.message ?? "Floopy gateway error", args);
    this.name = "FloopyServerError";
  }
}

export class FloopyTimeoutError extends FloopyError {
  constructor(message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "FloopyTimeoutError";
  }
}

export class FloopyConnectionError extends FloopyError {
  constructor(message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "FloopyConnectionError";
  }
}

export function errorFromStatus(args: {
  status: number;
  body: FloopyErrorBody | string | undefined;
  requestId: string | undefined;
}): FloopyError {
  const { status, body, requestId } = args;
  const errObj = typeof body === "object" && body !== null ? body.error : undefined;
  const message = errObj?.message ?? `HTTP ${status}`;
  const code = errObj?.code;
  const init: FloopyErrorInit = { status, code, requestId, body };

  if (status === 400) return new FloopyValidationError({ ...init, message });
  if (status === 401) return new FloopyAuthError({ ...init, message });
  if (status === 403) {
    if (errObj?.feature !== undefined) {
      return new FloopyPlanError({ ...init, message, feature: errObj.feature });
    }
    return new FloopyAuthError({ ...init, message });
  }
  if (status === 404) return new FloopyNotFoundError({ ...init, message });
  if (status === 409) return new FloopyConflictError({ ...init, message });
  if (status === 429) return new FloopyRateLimitError({ ...init, message });
  if (status >= 500) return new FloopyServerError({ ...init, message });
  return new FloopyError(message, init);
}
