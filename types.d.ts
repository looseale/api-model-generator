export declare type ApiType = 'RAML 1.0' | 'RAML 0.8' | 'OAS 2.0' | 'OAS 3.0' | 'OAS 3.1' | 'OAS 3.2' | 'ASYNC 2.0' | 'ASYNC 3.0' | 'ASYNC 3.1' | 'GRPC';

export declare interface ApiConfiguration {
  /**
   * The type of the API file
   */
  type: ApiType;
  /**
   * The API mime type
   * @default application/yaml
   */
  mime?: string;
  /**
   * The resolution pipeline to use when processing the API. 
   * @default editing
   */
  resolution?: string;
  /**
   * Whether to apply flattened to render options
   * @default false
   */
  flattened?: boolean;
  /**
   * Whether to include AMF source maps in the generated model.
   * Disable for large APIs (e.g. gRPC) to reduce model size significantly.
   * Source maps are only needed for editing tooling, not for browsing/display.
   * @default true
   */
  sourceMaps?: boolean;
}

export declare interface ApiGenerationOptions {
  /**
   * The directory where APIs are located.
   * @default "demo/"
   */
  src?: string;
  /**
   * The directory where to create the files.
   * @default "demo/"
   */
  dest?: string;
}

export declare interface FilePrepareResult {
  opts: ApiGenerationOptions;
  files: Map<string, ApiConfiguration|string|string[]>;
}
