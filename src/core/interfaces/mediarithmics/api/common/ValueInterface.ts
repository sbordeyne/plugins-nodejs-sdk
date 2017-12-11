
export interface AssetFilePropertyResource {
  original_file_name: string;
  asset_id: string;
  file_path: string;
}

export interface DataFilePropertyResource {
  uri: string;
  last_modified: number;
}

export interface UrlPropertyResource {
  url: string;
}

export interface StringPropertyResource {
  value: string;
}
export interface AdLayoutPropertyResource {
  id: string;
  version: string;
}
export interface StyleSheetPropertyResource {
  id: string;
  version: string;
}
export interface PixelTagPropertyResource {
  value: string;
}
export interface DoublePropertyResource {
  value: number;
}
export interface BooleanPropertyResource {
  value: boolean;
}
export interface IntPropertyResource {
  value: number;
}
export interface RecommenderPropertyResource {
  recommender_id: string;
}