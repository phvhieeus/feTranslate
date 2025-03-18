// services/grammarChecker.js
export async function checkGrammarWithGemini(text, language) {
  if (!text || text.trim() === '') return { errorCount: 0, errors: [], checked: false };
  
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `Kiểm tra văn bản ${language} sau đây tìm lỗi ngữ pháp và chính tả NGHIÊM TRỌNG. 
            
            Hướng dẫn quan trọng:
            - CHỈ đánh dấu từ là lỗi nếu chắc chắn rằng nó sai chính tả hoặc sai ngữ pháp
            - KHÔNG đánh dấu các từ thông dụng là lỗi (như "name", "my", "the", "and", "to", v.v.)
            - KHÔNG kiểm tra hoặc báo lỗi dấu câu (như dấu chấm, phẩy, chấm hỏi, chấm cảm, v.v.)
            - Bỏ qua tất cả các vấn đề liên quan đến dấu câu
            - Chỉ tập trung vào lỗi chính tả và ngữ pháp của các từ
            - Xem xét toàn bộ câu để đảm bảo chính xác khi báo lỗi
            
            Trả kết quả dưới dạng JSON với cấu trúc như sau:
            {
              "errorCount": số lỗi tìm thấy,
              "errors": [
                {
                  "word": "từ sai",
                  "suggestion": "gợi ý sửa",
                  "explanation": "Giải thích CHI TIẾT tại sao đây là lỗi và cách sửa đúng",
                  "context": "đoạn văn bản chứa lỗi (tối đa 10 từ)"
                },
                ...
              ]
            }
            
            Văn bản cần kiểm tra: "${text}"
            
            Chỉ trả về JSON, không giải thích thêm. Nếu không có lỗi, trả về JSON với errorCount: 0 và mảng errors rỗng.`
          },
        ],
      },
    ],
  };

  try {
    console.log(`Đang kiểm tra ngữ pháp cho: "${text}" (${language})`);
    
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
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Cố gắng parse JSON từ phản hồi
    try {
      // Tìm và trích xuất phần JSON từ phản hồi
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : "{}";
      const result = JSON.parse(jsonStr);
      
      // Thêm bước lọc để loại bỏ các từ thông dụng và các lỗi liên quan đến dấu câu
      const commonWords = ["name", "my", "your", "his", "her", "their", "our", "its"];
      const filteredErrors = Array.isArray(result.errors) 
        ? result.errors
            .filter(error => !commonWords.includes(error.word.toLowerCase()))
            // Lọc bỏ lỗi liên quan đến dấu câu
            .filter(error => error.word !== "[PUNCT]" && 
                   !error.word.includes(".") && 
                   !error.word.includes(",") && 
                   !error.word.includes("?") && 
                   !error.word.includes("!") &&
                   !error.explanation?.toLowerCase().includes("punctuation") &&
                   !error.explanation?.toLowerCase().includes("dấu câu"))
        : [];
      
      // Thêm ID cho mỗi lỗi
      const errorsWithId = filteredErrors.map((error, index) => ({
        ...error,
        id: `error-${Date.now()}-${index}`
      }));
      
      return {
        errorCount: errorsWithId.length,
        errors: errorsWithId,
        checked: true,
        timestamp: Date.now()
      };
    } catch (parseError) {
      console.error("Lỗi parse JSON từ API:", parseError);
      return { errorCount: 0, errors: [], checked: true };
    }
  } catch (error) {
    console.error("Lỗi kiểm tra ngữ pháp:", error);
    return {
      errorCount: 0,
      errors: [],
      checked: false
    };
  }
}
