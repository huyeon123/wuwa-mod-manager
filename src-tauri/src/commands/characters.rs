use crate::models::Character;

#[tauri::command]
pub async fn get_characters() -> Result<Vec<Character>, String> {
    let characters = vec![
        Character {
            id: "rover-male".to_string(),
            name: "로버 (남)".to_string(),
            name_en: "Rover (Male)".to_string(),
            element: Some("Spectro".to_string()),
            rarity: Some(5),
            thumbnail: "rover-male.png".to_string(),
        },
        Character {
            id: "rover-female".to_string(),
            name: "로버 (여)".to_string(),
            name_en: "Rover (Female)".to_string(),
            element: Some("Spectro".to_string()),
            rarity: Some(5),
            thumbnail: "rover-female.png".to_string(),
        },
        Character {
            id: "jiyan".to_string(),
            name: "감우".to_string(),
            name_en: "Jiyan".to_string(),
            element: Some("Aero".to_string()),
            rarity: Some(5),
            thumbnail: "jiyan.png".to_string(),
        },
        Character {
            id: "yinlin".to_string(),
            name: "인린".to_string(),
            name_en: "Yinlin".to_string(),
            element: Some("Electro".to_string()),
            rarity: Some(5),
            thumbnail: "yinlin.png".to_string(),
        },
        Character {
            id: "changli".to_string(),
            name: "창리".to_string(),
            name_en: "Changli".to_string(),
            element: Some("Fusion".to_string()),
            rarity: Some(5),
            thumbnail: "changli.png".to_string(),
        },
    ];

    Ok(characters)
}
