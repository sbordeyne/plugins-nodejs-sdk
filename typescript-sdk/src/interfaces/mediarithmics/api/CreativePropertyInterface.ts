import { Value } from "./ValueInterface"

export interface CreativePropertyResponse {
    status: string;
    data: CreativeProperty[];
    count: number;
}

export interface CreativeProperty {
    technical_name: string;
    value: Value;
    property_type: string;
    origin: string;
    writable: boolean;
    deletable: boolean;
}