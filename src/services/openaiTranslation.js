// src/services/openaiTranslation.js

// Hàm dịch văn bản thông thường với trọng âm, từ loại, phiên âm
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

Định dạng phản hồi dưới dạng JSON với cấu trúc sau (CHỈ trả về JSON, không có ký tự nào khác trước hoặc sau):
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
    // Cấu hình an toàn (tùy chọn)
    safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
    generationConfig: {
        // temperature: 0.7, // Điều chỉnh độ sáng tạo nếu cần
    }
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
      const errorBody = await response.text();
      console.error("API Error Body (translateWithGemini):", errorBody);
      throw new Error(`API lỗi: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    // Kiểm tra cấu trúc phản hồi
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        console.error("API response không hợp lệ (translateWithGemini):", data);
        throw new Error("Phản hồi từ API không chứa nội dung mong đợi.");
    }

    const responseText = data.candidates[0].content.parts[0].text;

    // Parse JSON response một cách an toàn
    try {
      // Tìm JSON trong response text (loại bỏ các ký tự markdown nếu có)
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})/);
      if (!jsonMatch) {
          console.error("Không tìm thấy JSON trong phản hồi (translateWithGemini):", responseText);
          // Nếu không tìm thấy JSON, thử trả về toàn bộ responseText như là bản dịch
          return {
            sourceTextWithStress: text, // Trả về text gốc
            translation: responseText, // Trả về toàn bộ text nhận được
            partsOfSpeech: [],
            phonetics: []
          };
      }
      const jsonStr = jsonMatch[1] ? jsonMatch[1].trim() : jsonMatch[2].trim();
      const result = JSON.parse(jsonStr);

      // Đảm bảo các trường dữ liệu tồn tại
      return {
        sourceTextWithStress: result.sourceTextWithStress || text,
        translation: result.translation || responseText, // Fallback về responseText nếu translation rỗng
        partsOfSpeech: result.partsOfSpeech || [],
        phonetics: result.phonetics || []
      };
    } catch (parseError) {
      console.error("Lỗi phân tích JSON (translateWithGemini):", parseError, "Response text:", responseText);
      // Nếu lỗi parse, trả về bản dịch là responseText gốc
      return {
        sourceTextWithStress: text,
        translation: responseText,
        partsOfSpeech: [],
        phonetics: []
      };
    }
  } catch (error) {
    console.error("Lỗi gọi API dịch (translateWithGemini):", error);
    // Trả về lỗi trong bản dịch để người dùng biết
    return {
      sourceTextWithStress: text,
      translation: `Lỗi dịch: ${error.message}`,
      partsOfSpeech: [],
      phonetics: []
    };
  }
}

// Hàm mới cho dịch thành ngữ
export async function translateIdiomWithGemini(text, sourceLang, targetLang) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

  // Prompt chuyên biệt cho thành ngữ
  const prompt = `Bạn là chuyên gia ngôn ngữ. Hãy phân tích câu/thành ngữ sau bằng tiếng "${sourceLang}" và tìm ra câu hoặc thành ngữ tương đương **tự nhiên nhất** trong tiếng "${targetLang}".

Nhiệm vụ:
1.  Hiểu sâu sắc ý nghĩa, sắc thái và ngữ cảnh của câu gốc.
2.  Tìm một câu hoặc thành ngữ trong tiếng "${targetLang}" truyền tải **chính xác ý nghĩa và cảm xúc tương tự**. Ưu tiên các cách diễn đạt tự nhiên, thường dùng trong đời sống. Tránh dịch word-by-word nếu không phù hợp.
3.  Cung cấp một giải thích ngắn gọn (tối đa 2-3 câu) về lý do tại sao câu/thành ngữ đích lại tương đương, hoặc giải thích sắc thái của câu gốc và câu đích.

Trả lời dưới dạng JSON với cấu trúc sau (CHỈ trả về JSON, không có ký tự nào khác trước hoặc sau):
{
  "equivalentPhrase": "Câu hoặc thành ngữ tương đương trong tiếng ${targetLang}",
  "explanation": "Giải thích ngắn gọn về sự tương đương hoặc sắc thái."
}

Nếu không tìm thấy cách diễn đạt tương đương thực sự tốt, hãy trả về equivalentPhrase là một bản dịch nghĩa đen nhưng tự nhiên nhất có thể và giải thích rằng không có thành ngữ trực tiếp. Nếu câu gốc không có vẻ là thành ngữ hoặc cách nói đặc biệt, hãy dịch nó một cách tự nhiên nhất.

Câu gốc (${sourceLang}): "${text}"
`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
     // Cấu hình an toàn để tránh chặn nội dung không mong muốn (tùy chọn)
     safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
     ],
     generationConfig: {
        // temperature: 0.7, // Điều chỉnh độ sáng tạo nếu cần
     }
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
       const errorBody = await response.text();
       console.error("API Error Body (translateIdiomWithGemini):", errorBody);
       throw new Error(`API lỗi: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

     // Kiểm tra xem có candidates và content không
     if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        console.error("API response không hợp lệ (translateIdiomWithGemini):", data);
        throw new Error("Phản hồi từ API không chứa nội dung mong đợi.");
     }

    const responseText = data.candidates[0].content.parts[0].text;

    // Parse JSON response một cách an toàn
    try {
      // Tìm JSON trong response text (loại bỏ các ký tự markdown nếu có)
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})/);
      if (!jsonMatch) {
          console.error("Không tìm thấy JSON trong phản hồi (translateIdiomWithGemini):", responseText);
          // Nếu không tìm thấy JSON, có thể AI trả về text thường
          // Trả về text đó như là equivalentPhrase và không có explanation
          return {
            equivalentPhrase: responseText,
            explanation: "AI không trả về định dạng JSON mong đợi."
          };
          // Hoặc throw lỗi tùy theo cách bạn muốn xử lý
          // throw new Error("Không thể trích xuất JSON từ phản hồi API.");
      }
      // Ưu tiên group 1 (nếu có markdown), nếu không thì group 2
      const jsonStr = jsonMatch[1] ? jsonMatch[1].trim() : jsonMatch[2].trim();

      const result = JSON.parse(jsonStr);

      // Đảm bảo các trường dữ liệu tồn tại
      return {
        equivalentPhrase: result.equivalentPhrase || "Không thể dịch thành ngữ.", // Fallback nếu thiếu
        explanation: result.explanation || "" // Fallback nếu thiếu
      };
    } catch (parseError) {
      console.error("Lỗi phân tích JSON từ API thành ngữ:", parseError, "Response text:", responseText);
      // Trả về lỗi hoặc một giá trị mặc định nếu không parse được
       return {
         equivalentPhrase: "Lỗi xử lý phản hồi từ AI.",
         explanation: `Chi tiết lỗi: ${parseError.message}. Phản hồi gốc: ${responseText}` // Bao gồm cả phản hồi gốc để debug
       };
    }
  } catch (error) {
     console.error("Lỗi gọi API dịch thành ngữ:", error);
    // Trả về lỗi để component có thể hiển thị
    return {
      equivalentPhrase: `Lỗi: ${error.message}`,
      explanation: ""
    };
  }
}
