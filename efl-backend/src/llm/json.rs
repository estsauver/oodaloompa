use serde_json::Value;

// Try direct parse, then attempt to extract the largest JSON object from text.
pub fn parse_json<T: serde::de::DeserializeOwned>(raw: &str) -> Result<T, String> {
    serde_json::from_str::<T>(raw).or_else(|_| {
        let start = raw.find('{').ok_or("no json start")?;
        let end = raw.rfind('}').ok_or("no json end")?;
        let slice = &raw[start..=end];
        serde_json::from_str::<T>(slice).map_err(|e| format!("repair parse: {e}"))
    })
}

