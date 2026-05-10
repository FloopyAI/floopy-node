import type OpenAI from "openai";

import { FloopyHttp } from "./http.js";
import { createOpenAIDelegate } from "./openai-delegate.js";
import { ConstraintsResource } from "./resources/constraints.js";
import { DecisionsResource } from "./resources/decisions.js";
import { EvaluationsResource } from "./resources/evaluations.js";
import { ExperimentsResource } from "./resources/experiments.js";
import { ExportResource } from "./resources/export.js";
import { FeedbackResource } from "./resources/feedback.js";
import { RoutingResource } from "./resources/routing.js";
import type { FloopyClientOptions } from "./types/shared.js";

export class Floopy {
  /** @internal */
  readonly _http: FloopyHttp;
  private _openai: OpenAI | undefined;

  readonly feedback: FeedbackResource;
  readonly decisions: DecisionsResource;
  readonly experiments: ExperimentsResource;
  readonly constraints: ConstraintsResource;
  readonly export: ExportResource;
  readonly evaluations: EvaluationsResource;
  readonly routing: RoutingResource;

  constructor(options: FloopyClientOptions) {
    this._http = FloopyHttp.fromClientOptions(options);
    this.feedback = new FeedbackResource(this._http);
    this.decisions = new DecisionsResource(this._http);
    this.experiments = new ExperimentsResource(this._http);
    this.constraints = new ConstraintsResource(this._http);
    this.export = new ExportResource(this._http);
    this.evaluations = new EvaluationsResource(this._http);
    this.routing = new RoutingResource(this._http);
  }

  /**
   * Lazily-instantiated OpenAI client pre-configured to talk to the Floopy
   * gateway. `client.chat.completions.create(...)` and
   * `client.embeddings.create(...)` are 1:1 drop-in replacements for the
   * upstream `openai` package.
   */
  get openai(): OpenAI {
    if (this._openai === undefined) {
      this._openai = createOpenAIDelegate(this._http);
    }
    return this._openai;
  }

  get chat(): OpenAI["chat"] {
    return this.openai.chat;
  }

  get embeddings(): OpenAI["embeddings"] {
    return this.openai.embeddings;
  }

  get models(): OpenAI["models"] {
    return this.openai.models;
  }
}
