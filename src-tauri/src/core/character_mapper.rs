use std::collections::HashMap;

/// GameBanana 카테고리명을 앱 캐릭터 ID(한글명)로 매핑
pub fn detect_character(category_name: Option<&str>, mod_name: &str) -> Option<String> {
    let mapping = build_character_mapping();

    // 1단계: category_name을 매핑 테이블과 대소문자 무시 비교
    if let Some(cat) = category_name {
        let cat_lower = cat.to_lowercase();
        if let Some(char_id) = mapping.get(&cat_lower) {
            return Some(char_id.to_string());
        }
    }

    // 2단계: mod_name에서 영문 캐릭터명 키워드 검색 (긴 이름부터 먼저 매칭)
    let mod_name_lower = mod_name.to_lowercase();
    let mut sorted_keys: Vec<_> = mapping.keys().collect();
    sorted_keys.sort_by(|a, b| b.len().cmp(&a.len())); // 긴 이름부터

    for key in sorted_keys {
        if mod_name_lower.contains(key) {
            return Some(mapping.get(key).unwrap().to_string());
        }
    }

    // 3단계: 둘 다 실패하면 None
    None
}

fn build_character_mapping() -> HashMap<String, String> {
    let mut map = HashMap::new();

    // 방랑자
    map.insert("rover".to_string(), "방랑자".to_string());

    // 감심 ~ 플뢰르・드・리스
    map.insert("jianxin".to_string(), "감심".to_string());
    map.insert("qiuyuan".to_string(), "구원".to_string());
    map.insert("jiyan".to_string(), "기염".to_string());
    map.insert("ciaccona".to_string(), "샤콘".to_string());
    map.insert("aalto".to_string(), "알토".to_string());
    map.insert("yangyang".to_string(), "양양".to_string());
    map.insert("iuno".to_string(), "유노".to_string());
    map.insert("cartethyia".to_string(), "카르티시아".to_string());
    map.insert("fleurdelys".to_string(), "플뢰르・드・리스".to_string());

    // 갈브레나 ~ 치샤
    map.insert("galbrena".to_string(), "갈브레나".to_string());
    map.insert("lupa".to_string(), "루파".to_string());
    map.insert("mornye".to_string(), "모니에".to_string());
    map.insert("mortefi".to_string(), "모르테피".to_string());
    map.insert("brant".to_string(), "브렌트".to_string());
    map.insert("encore".to_string(), "앙코".to_string());
    map.insert("aemeath".to_string(), "에이메스".to_string());
    map.insert("changli".to_string(), "장리".to_string());
    map.insert("chixia".to_string(), "치샤".to_string());

    // 능양 ~ 카를로타
    map.insert("lingyang".to_string(), "능양".to_string());
    map.insert("sanhua".to_string(), "산화".to_string());
    map.insert("baizhi".to_string(), "설지".to_string());
    map.insert("youhu".to_string(), "유호".to_string());
    map.insert("zhezhi".to_string(), "절지".to_string());
    map.insert("carlotta".to_string(), "카를로타".to_string());

    // 단근 ~ 플로로
    map.insert("danjin".to_string(), "단근".to_string());
    map.insert("taoqi".to_string(), "도기".to_string());
    map.insert("roccia".to_string(), "로코코".to_string());
    map.insert("chisa".to_string(), "치사".to_string());
    map.insert("camellya".to_string(), "카멜리아".to_string());
    map.insert("cantarella".to_string(), "칸타렐라".to_string());
    map.insert("phrolova".to_string(), "플로로".to_string());

    // 루미 ~ 카카루
    map.insert("lumi".to_string(), "루미".to_string());
    map.insert("buling".to_string(), "복링".to_string());
    map.insert("augusta".to_string(), "아우구스타".to_string());
    map.insert("yuanwu".to_string(), "연무".to_string());
    map.insert("yinlin".to_string(), "음림".to_string());
    map.insert("calcharo".to_string(), "카카루".to_string());

    // 금희 ~ 페비
    map.insert("jinhsi".to_string(), "금희".to_string());
    map.insert("lynae".to_string(), "린네".to_string());
    map.insert("luuk herssen".to_string(), "루크・헤르센".to_string());
    map.insert("verina".to_string(), "벨리나".to_string());
    map.insert("xiangli yao".to_string(), "상리요".to_string());
    map.insert("zani".to_string(), "젠니".to_string());
    map.insert("shorekeeper".to_string(), "파수인".to_string());
    map.insert("phoebe".to_string(), "페비".to_string());

    // 기타
    map.insert("bike".to_string(), "바이크".to_string());
    map.insert("glider".to_string(), "글라이더".to_string());
    map.insert("others".to_string(), "기타".to_string());

    map
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_by_category() {
        assert_eq!(
            detect_character(Some("Aemeath"), "Some Mod Name"),
            Some("에이메스".to_string())
        );
        assert_eq!(
            detect_character(Some("Rover"), "Another Mod"),
            Some("방랑자".to_string())
        );
    }

    #[test]
    fn test_detect_by_mod_name() {
        assert_eq!(
            detect_character(None, "Jinhsi Summer Skin"),
            Some("금희".to_string())
        );
        assert_eq!(
            detect_character(Some("Unknown"), "Camellya Wedding Dress"),
            Some("카멜리아".to_string())
        );
    }

    #[test]
    fn test_long_name_priority() {
        // "Luuk Herssen"이 "Luuk"보다 먼저 매칭되어야 함
        assert_eq!(
            detect_character(None, "Luuk Herssen Custom Outfit"),
            Some("루크・헤르센".to_string())
        );
    }

    #[test]
    fn test_no_match() {
        assert_eq!(
            detect_character(Some("Unknown Category"), "Random Mod"),
            None
        );
    }
}
