use crate::core::mod_fixer;

#[tauri::command]
pub async fn run_mod_fixer(mods_path: String) -> Result<String, String> {
    mod_fixer::run_mod_fixer(&mods_path).await
}
