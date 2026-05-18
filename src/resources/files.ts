import { ENDPOINTS } from "../constants/endpoints.js";
import type { FloopyHttp } from "../http.js";
import type { FileList, FileObject, FileListParams, FileUploadParams } from "../types/files.js";
import { batchInit, type BatchRequestOptions } from "./batch-options.js";

/**
 * Files API — upload/list/retrieve/delete files and download file
 * content. v1 targets the `batch` purpose (JSONL input + output files).
 * Traffic is forwarded verbatim to the provider selected via the
 * `provider` option (`floopy-provider` header).
 */
export class FilesResource {
  constructor(private readonly http: FloopyHttp) {}

  /** Upload a file (multipart). Use `purpose: "batch"` for batch input. */
  async upload(
    params: FileUploadParams,
    options?: BatchRequestOptions,
  ): Promise<FileObject> {
    const form = new FormData();
    form.set("purpose", params.purpose);
    if (params.filename !== undefined) form.set("file", params.file, params.filename);
    else form.set("file", params.file);
    const { data } = await this.http.request<FileObject>(
      "POST",
      ENDPOINTS.FILES,
      batchInit(options, { body: form }),
    );
    return data;
  }

  /** List files, optionally filtered by `purpose`. */
  async list(params?: FileListParams, options?: BatchRequestOptions): Promise<FileList> {
    const { data } = await this.http.request<FileList>(
      "GET",
      ENDPOINTS.FILES,
      batchInit(options, {
        query: {
          purpose: params?.purpose,
          limit: params?.limit,
          after: params?.after,
        },
      }),
    );
    return data;
  }

  /** Retrieve a single file's metadata. */
  async retrieve(id: string, options?: BatchRequestOptions): Promise<FileObject> {
    const { data } = await this.http.request<FileObject>(
      "GET",
      ENDPOINTS.FILE_BY_ID(id),
      batchInit(options),
    );
    return data;
  }

  /**
   * Download raw file content (e.g. a batch output/error JSONL). Returns
   * the raw `Response` so the caller can `.text()` or stream `.body`.
   */
  async content(id: string, options?: BatchRequestOptions): Promise<Response> {
    return this.http.requestRaw("GET", ENDPOINTS.FILE_CONTENT(id), batchInit(options));
  }

  /** Delete a file. */
  async delete(id: string, options?: BatchRequestOptions): Promise<FileObject> {
    const { data } = await this.http.request<FileObject>(
      "DELETE",
      ENDPOINTS.FILE_BY_ID(id),
      batchInit(options),
    );
    return data;
  }
}
