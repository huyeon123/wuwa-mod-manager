export interface Character {
  id: string;
  name: string;
  nameEn: string;
  category: string;  // "캐릭터" | "주인공" | "바이크" | "글라이더" | "기타"
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
  xxmiLauncherPath?: string;
}
