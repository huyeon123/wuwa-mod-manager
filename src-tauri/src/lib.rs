mod commands;
mod core;
mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            commands::characters::get_characters,
            commands::mods::get_mods,
            commands::mods::enable_mod,
            commands::mods::disable_mod,
            commands::mods::import_mod,
            commands::mods::delete_mod,
            commands::mods::get_mod_counts,
            commands::config::get_config,
            commands::config::set_mods_path,
            commands::config::set_xxmi_launcher_path,
            commands::config::launch_xxmi,
            commands::config::auto_detect_paths,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
