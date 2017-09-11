import { Value } from "./ValueInterface";

export interface PluginPropertyResponse {
  status: string;
  data: PluginProperty[];
  count: number;
}

export interface PluginProperty {
  technical_name: string;
  value: Value;
  property_type: string;
  origin: string;
  writable: boolean;
  deletable: boolean;
}
