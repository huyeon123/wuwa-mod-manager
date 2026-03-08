export interface HuihuiBrowseResult {
  mods: HuihuiMod[];
  hasMore: boolean;
}

export interface HuihuiMod {
  id: number;
  name: string;
  originalName: string;
  characterName: string | null;
  detailUrl: string;
  thumbnailUrl: string | null;
}

export interface HuihuiDownloadLink {
  label: string;
  originalLabel: string;
  url: string;
  password: string | null;
}

export interface HuihuiModDetail {
  id: number;
  name: string;
  originalName: string;
  characterName: string | null;
  pageUrl: string;
  previewImages: string[];
  downloadLinks: HuihuiDownloadLink[];
  description: string | null;
}
