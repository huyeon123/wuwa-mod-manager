use crate::core::mod_fixer;

#[tauri::command]
pub async fn run_all_fixers(mods_path: String) -> Result<String, String> {
    mod_fixer::run_all(&mods_path).await
}

#[tauri::command]
pub async fn run_stable_textures(mods_path: String) -> Result<String, String> {
    mod_fixer::run_stable_textures(&mods_path).await
}

#[tauri::command]
pub async fn run_fixer_only(mods_path: String) -> Result<String, String> {
    mod_fixer::run_fixer_only(&mods_path).await
}
