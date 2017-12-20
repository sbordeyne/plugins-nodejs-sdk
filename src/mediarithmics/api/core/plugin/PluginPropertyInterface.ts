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

import {Option} from '../../../utils/index';

export interface PluginPropertyResponse {
  status: string;
  data: PluginProperty[];
  count: number;
}

export type PluginProperty  =
    AssetFileProperty
  | DataFileProperty
  | UrlProperty
  | StringProperty
  | AdLayoutProperty
  | StyleSheetProperty
  | PixelTagProperty
  | DoubleProperty
  | BooleanProperty
  | IntProperty
  | RecommenderProperty
  ;

export type PropertyType =
  'ASSET'
  | 'DATA_FILE'
  | 'URL'
  | 'STRING'
  | 'AD_LAYOUT'
  | 'STYLE_SHEET'
  | 'PIXEL_TAG'
  | 'DOUBLE'
  | 'BOOLEAN'
  | 'INT'
  | 'RECOMMENDER';

export type PropertyOrigin = 'PLUGIN_STATIC' | 'PLUGIN' | 'INSTANCE';

export interface AbstractProperty {
  technical_name: string;
  origin: PropertyOrigin;
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

export function asAssetFileProperty(p : PluginProperty): Option<AssetFileProperty> {
    return p.property_type === 'ASSET' ? p : undefined;
}
export function asDataFileProperty(p : PluginProperty): Option<DataFileProperty> {
    return p.property_type === 'DATA_FILE' ? p : undefined;
}
export function asAdLayoutProperty(p : PluginProperty): Option<AdLayoutProperty> {
  return p.property_type === 'AD_LAYOUT' ? p : undefined;
}

export function asUrlProperty(p : PluginProperty): Option<UrlProperty> {
  return p.property_type === 'URL' ? p : undefined;
}

export function asRecommenderProperty(p : PluginProperty): Option<RecommenderProperty> {
  return p.property_type === 'RECOMMENDER' ? p : undefined;
}

export function asStringProperty(p : PluginProperty): Option<StringProperty> {
  return p.property_type === 'STRING' ? p : undefined;
}