export interface RunQueryRequest {
  name: string;
  params?: Record<string, unknown>;
}

export interface DataProvider {
  runQuery(request: RunQueryRequest): Promise<unknown[]>;
}
