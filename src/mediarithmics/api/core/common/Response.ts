export type StatusCode = "ok" | "error";

export interface ResponseData<T> {
  data: T;
  status: StatusCode;
}

export interface ResponseListOfData<T> {
  data: T[];
  status: string;
  count: number;
  first_result?: number;
  max_results?: number;
  total?: number;
}