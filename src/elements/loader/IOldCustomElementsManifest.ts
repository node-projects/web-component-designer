export interface IOldCustomElementsManifest {
  version: string;
  tags: IOldCustomElementsManifestTag[];
}

export interface IOldCustomElementsManifestTag {
  name: string;
  path: string;
  description?: string;
  attributes?: IOldCustomElementsManifestAttribute[];
  properties?: IOldCustomElementsManifestProperty[];
}


export interface IOldCustomElementsManifestAttribute {
  name: string;
  description?: string;
  type: string;
  default?: string;
}

export interface IOldCustomElementsManifestProperty {
  name: string;
  attribute?: string;
  description?: string;
  type: string;
  default?: string;
}