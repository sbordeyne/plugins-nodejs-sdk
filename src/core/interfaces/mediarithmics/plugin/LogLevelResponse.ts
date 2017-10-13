import { ResponseStatusCode } from "./ResponseStatusCode";

export interface LogLevelUpdateResponse {
  status: ResponseStatusCode;
  msg?: string;
}