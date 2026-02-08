mod commands;
mod core;
mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::characters::get_characters,
            commands::mods::get_mods,
            commands::mods::enable_mod,
            commands::mods::disable_mod,
            commands::config::get_config,
            commands::config::set_mods_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
