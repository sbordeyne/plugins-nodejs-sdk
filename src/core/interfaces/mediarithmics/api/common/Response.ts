export type statusCode = "ok" | "error";

export interface ResponseData<T> {
  data: T;
  status: statusCode;
}

export interface ResponseListOfData<T> {
  data: T[];
  status: string;
  count: number;
  first_result?: number;
  max_results?: number;
  total?: number;
}