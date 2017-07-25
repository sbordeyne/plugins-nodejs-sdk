import { Value } from "./ValueInterface";

export interface ActivityAnalyzerPropertyResponse {
  status: string;
  data: ActivityAnalyzerProperty[];
  count: number;
}

export interface ActivityAnalyzerProperty {
  technical_name: string;
  value: Value;
  property_type: string;
  origin: string;
  writable: boolean;
  deletable: boolean;
}
