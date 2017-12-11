import {
  AssetFilePropertyResource,
  DataFilePropertyResource,
  UrlPropertyResource,
  StringPropertyResource,
  AdLayoutPropertyResource,
  StyleSheetPropertyResource,
  PixelTagPropertyResource,
  DoublePropertyResource,
  BooleanPropertyResource,
  IntPropertyResource,
  RecommenderPropertyResource
} from "./ValueInterface";

export interface PluginPropertyResponse {
  status: string;
  data: PluginProperty[];
  count: number;
}

export type PluginProperty =
  AssetFilePropertyResource
  | DataFilePropertyResource
  | UrlPropertyResource
  | StringPropertyResource
  | AdLayoutPropertyResource
  | StyleSheetPropertyResource
  | PixelTagPropertyResource
  | DoublePropertyResource
  | BooleanPropertyResource
  | IntPropertyResource
  | RecommenderPropertyResource;

export interface AbstractProperty {
  technical_name: string;
  origin: string;
  writable: boolean;
  deletable: boolean;
}
export interface AssetFileProperty
  extends AbstractProperty {
  property_type: 'ASSET';
  value: AssetFilePropertyResource;
}

export interface DataFileProperty
  extends AbstractProperty {
  property_type: 'DATA_FILE';
  value: DataFilePropertyResource;
}
export interface UrlProperty
  extends AbstractProperty {
  property_type: 'URL';
  value: UrlPropertyResource;
}
export interface StringProperty
  extends AbstractProperty {
  property_type: 'STRING';
  value: StringPropertyResource;
}
export interface AdLayoutProperty
  extends AbstractProperty {
  property_type: 'AD_LAYOUT';
  value: AdLayoutPropertyResource;
}
export interface StyleSheetProperty
  extends AbstractProperty {
  property_type: 'STYLE_SHEET';
  value: StyleSheetPropertyResource;
}
export interface PixelTagProperty
  extends AbstractProperty {
  property_type: 'PIXEL_TAG';
  value: PixelTagPropertyResource;
}
export interface DoubleProperty
  extends AbstractProperty {
  property_type: 'DOUBLE';
  value: DoublePropertyResource;
}
export interface BooleanProperty
  extends AbstractProperty {
  property_type: 'BOOLEAN';
  value: BooleanPropertyResource;
}
export interface IntProperty
  extends AbstractProperty {
  property_type: 'INT';
  value: IntPropertyResource;
}
export interface RecommenderProperty
  extends AbstractProperty {
  property_type: 'RECOMMENDER';
  value: RecommenderPropertyResource;
}