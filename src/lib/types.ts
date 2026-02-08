export interface Character {
  id: string;
  name: string;
  nameEn: string;
  element?: string;
  rarity?: number;
  thumbnail: string;
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
}

export interface Preset {
  id: string;
  name: string;
  description?: string;
  enabledMods: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppConfig {
  modsPath?: string;
  gamePath?: string;
}
