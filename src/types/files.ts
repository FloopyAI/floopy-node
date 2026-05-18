/**
 * Files API types. The gateway forwards file traffic verbatim to the
 * resolved provider, so these mirror the OpenAI file shapes with an open
 * index signature for provider-specific extras (no wire mapping).
 */

export interface FileObject {
  id: string;
  object?: string;
  bytes?: number;
  created_at?: number;
  filename?: string;
  purpose?: string;
  status?: string;
  [key: string]: unknown;
}

export interface FileList {
  object?: string;
  data: FileObject[];
  [key: string]: unknown;
}

export interface FileUploadParams {
  /** The file contents. A `Blob`/`File` is forwarded as multipart. */
  file: Blob;
  /** Optional filename used in the multipart part. */
  filename?: string;
  /** Upload purpose. Use `"batch"` for batch input files. */
  purpose: string;
}

export interface FileListParams {
  purpose?: string;
  limit?: number;
  after?: string;
}
