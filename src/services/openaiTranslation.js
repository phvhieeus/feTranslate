export async function translateWithGemini(text, sourceLang, targetLang) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `Dịch văn bản sau từ ${sourceLang} sang ${targetLang} với các cải tiến sau:
            
1. Đối với văn bản gốc, xác định và đánh dấu trọng âm của từng từ bằng cách thêm dấu nhấn (´) phía trên nguyên âm được nhấn mạnh. Ví dụ: "important" sẽ trở thành "impórtant". Đồng thời, cung cấp phiên âm IPA cho từng từ trong văn bản gốc.

2. Đối với văn bản đã dịch, phân loại mỗi từ quan trọng theo từ loại: danh từ (noun), động từ (verb), tính từ (adjective), trạng từ (adverb), đại từ (pronoun), giới từ (preposition), liên từ (conjunction), thán từ (interjection), mạo từ (article), từ hạn định (determiner).

3. Đảm bảo bản dịch chính xác và tự nhiên, phù hợp với ngữ cảnh và văn phong.

Định dạng phản hồi dưới dạng JSON với cấu trúc sau:
{
  "sourceTextWithStress": "Văn bản với trọng âm được đánh dấu bằng dấu nhấn (´)",
  "translation": "Bản dịch bình thường",
  "partsOfSpeech": [
    {"word": "example", "type": "noun"},
    {"word": "run", "type": "verb"},
    {"word": "beautiful", "type": "adjective"},
    {"word": "quickly", "type": "adverb"}
  ],
  "phonetics": [
    {"word": "example", "ipa": "/ɪɡˈzæmpəl/"},
    {"word": "beautiful", "ipa": "/ˈbjuːtɪfəl/"}
  ]
}

Văn bản gốc: "${text}"`,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API lỗi: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không thể dịch";
    
    // Parse JSON response
    try {
      // Find JSON in response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : "{}";
      const result = JSON.parse(jsonStr);
      
      // Đảm bảo các trường dữ liệu tồn tại
      return {
        sourceTextWithStress: result.sourceTextWithStress || text,
        translation: result.translation || responseText,
        partsOfSpeech: result.partsOfSpeech || [],
        phonetics: result.phonetics || []
      };
    } catch (parseError) {
      console.error("Lỗi phân tích JSON:", parseError);
      return { 
        sourceTextWithStress: text,
        translation: responseText,
        partsOfSpeech: [],
        phonetics: []
      };
    }
  } catch (error) {
    return {
      sourceTextWithStress: text,
      translation: `Error: ${error.message}`,
      partsOfSpeech: [],
      phonetics: []
    };
  }
}
