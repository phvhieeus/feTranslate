export async function translateWithDeepL(text, sourceLang, targetLang) {
    const apiUrl = "https://api-free.deepl.com/v2/translate";
    const apiKey = import.meta.env.VITE_DEEPL_API_KEY;
  
    const params = new URLSearchParams();
    params.append("auth_key", apiKey);
    params.append("text", text);
    params.append("source_lang", sourceLang.toUpperCase());
    params.append("target_lang", targetLang.toUpperCase());
  
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });
  
      const data = await response.json();
      return data.translations[0].text;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }