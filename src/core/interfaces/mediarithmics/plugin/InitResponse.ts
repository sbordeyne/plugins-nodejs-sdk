import { ResponseStatusCode } from "./ResponseStatusCode";

export interface InitUpdateResponse {
  status: ResponseStatusCode;
  msg?: string;
}