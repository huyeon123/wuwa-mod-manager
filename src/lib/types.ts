export interface Character {
  id: string;
  name: string;
  nameEn: string;
  category: string;  // "캐릭터" | "방랑자" | "기타"
  element?: string;
  rarity?: number;
  thumbnail: string;
}

export interface ModKeybinding {
  action: string;
  key: string;
}

export interface Mod {
  id: string;
  characterId: string;
  name: string;
  description?: string;
  author?: string;
  version?: string;
  tags?: string[];
  preview?: string[];
  enabled: boolean;
  path: string;
  createdAt: string;
  keybindings?: ModKeybinding[];
}

export interface ImportPreviewData {
  defaultName: string;
  previewImages: string[];
  tempDir: string | null;
}

export interface PresetMod {
  characterId: string;
  modId: string;
}

export interface Preset {
  id: string;
  name: string;
  mods: PresetMod[];
  createdAt: string;
}

export interface AppConfig {
  modsPath?: string;
  gamePath?: string;
  xxmiLauncherPath?: string;
  favoriteCharacters: string[];
  favoriteMods: string[];
  presets: Preset[];
}
