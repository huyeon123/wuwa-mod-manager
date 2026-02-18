export type SortOption = "Generic_LatestUpdated" | "Generic_MostLiked" | "Generic_MostDownloaded";

export interface BrowseResult {
  mods: GameBananaMod[];
  totalCount: number;
  hasMore: boolean;
}

export interface GameBananaMod {
  id: number;
  name: string;
  version: string | null;
  thumbnailUrl: string | null;
  submitterName: string;
  submitterAvatar: string | null;
  category: string;
  likeCount: number;
  viewCount: number;
  dateAdded: number;
  dateUpdated: number;
  hasFiles: boolean;
  tags: string[];
}

export interface GameBananaModDetail {
  id: number;
  name: string;
  description: string | null;
  textHtml: string | null;
  version: string | null;
  submitterName: string;
  categoryName: string | null;
  superCategory: string | null;
  previewImages: PreviewImage[];
  files: GameBananaFile[];
  likeCount: number;
  viewCount: number;
  detectedCharacterId: string | null;
}

export interface PreviewImage {
  url: string;
  thumbUrl: string;
}

export interface GameBananaFile {
  id: number;
  filename: string;
  filesize: number;
  downloadUrl: string;
  downloadCount: number;
  description: string | null;
  md5: string | null;
}

export interface DownloadProgress {
  fileId: number;
  downloaded: number;
  total: number;
  percent: number;
  phase: string;
}
