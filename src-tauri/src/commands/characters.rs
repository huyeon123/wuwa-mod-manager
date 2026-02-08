use crate::models::Character;

#[tauri::command]
pub async fn get_characters() -> Result<Vec<Character>, String> {
    let characters = vec![
        // 기류 (Aero)
        c("감심", "Jianxin", Some("기류")),
        c("구원", "Guwon", Some("기류")),
        c("기염", "Jiyan", Some("기류")),
        c("샤콘", "Shacon", Some("기류")),
        c("알토", "Alto", Some("기류")),
        c("양양", "Yangyang", Some("기류")),
        c("유노", "Yuno", Some("기류")),
        c("카르티시아", "Cartethia", Some("기류")),
        c("플뢰르・드・리스", "Fleur De Lis", Some("기류")),
        // 용융 (Fusion)
        c("갈브레나", "Galbrena", Some("용융")),
        c("루파", "Lupa", Some("용융")),
        c("모니에", "Monier", Some("용융")),
        c("모르테피", "Mortefi", Some("용융")),
        c("브렌트", "Brant", Some("용융")),
        c("앙코", "Encore", Some("용융")),
        c("에이메스", "Aymes", Some("용융")),
        c("장리", "Changli", Some("용융")),
        c("치샤", "Chixia", Some("용융")),
        // 응결 (Glacio)
        c("능양", "Lingyang", Some("응결")),
        c("산화", "Sanhua", Some("응결")),
        c("설지", "Setzhi", Some("응결")),
        c("유호", "Youhu", Some("응결")),
        c("절지", "Zhezhi", Some("응결")),
        c("카를로타", "Carlotta", Some("응결")),
        // 인멸 (Havoc)
        c("단근", "Danjin", Some("인멸")),
        c("도기", "Taoqi", Some("인멸")),
        c("로코코", "Rococo", Some("인멸")),
        c("치사", "Chisa", Some("인멸")),
        c("카멜리아", "Camellya", Some("인멸")),
        c("칸타렐라", "Cantarella", Some("인멸")),
        c("플로로", "Floro", Some("인멸")),
        // 전도 (Electro)
        c("루미", "Lumi", Some("전도")),
        c("복링", "Bulling", Some("전도")),
        c("아우구스타", "Augusta", Some("전도")),
        c("연무", "Yuanwu", Some("전도")),
        c("음림", "Yinlin", Some("전도")),
        c("카카루", "Kakaru", Some("전도")),
        // 회절 (Spectro)
        c("금희", "Jinhsi", Some("회절")),
        c("린네", "Rinne", Some("회절")),
        c("루크・헤르센", "Luke Herzen", Some("회절")),
        c("방랑자", "Rover", Some("회절")),
        c("벨리나", "Verina", Some("회절")),
        c("상리요", "Shorekeeper", Some("회절")),
        c("젠니", "Zenni", Some("회절")),
        c("파수인", "Phasuin", Some("회절")),
        c("페비", "Phoebe", Some("회절")),
    ];

    Ok(characters)
}

fn c(name: &str, name_en: &str, element: Option<&str>) -> Character {
    Character {
        id: name.to_string(),
        name: name.to_string(),
        name_en: name_en.to_string(),
        element: element.map(|e| e.to_string()),
        rarity: None,
        thumbnail: format!("/characters/char_{}.png", name),
    }
}
