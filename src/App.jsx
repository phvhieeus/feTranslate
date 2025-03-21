import React, { useState, useEffect } from "react";
import { TranslationTabs } from "./components/TranslationTabs";
import { LanguageControls } from "./components/LanguageControls";
import { TranslationPanel } from "./components/TranslationPanel";
import { ImageTranslation } from "./components/ImageTranslate";
import { DocumentTranslation } from "./components/DocumentTranslation";
import { translateWithGemini } from "./services/openaiTranslation";
import { checkGrammarWithGemini } from "./services/grammarChecker";
import { ErrorDetails } from "./components/ErrorDetails";
import debounce from "lodash.debounce";

function App() {
  const [activeTab, setActiveTab] = useState("text");
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [selectedSourceLang, setSelectedSourceLang] = useState("English");
  const [selectedTargetLang, setSelectedTargetLang] = useState("Vietnamese");
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);
  const [autoTranslate, setAutoTranslate] = useState(true);
  
  // Thêm state cho kiểm tra lỗi
  const [grammarErrors, setGrammarErrors] = useState({ errorCount: 0, errors: [], checked: false, timestamp: Date.now() });
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [sourceTextWithStress, setSourceTextWithStress] = useState("");
  const [partsOfSpeech, setPartsOfSpeech] = useState([]);
  // State cho phonetics
  const [phonetics, setPhonetics] = useState([]);
  
  // Cải tiến các hàm sửa lỗi để xử lý dấu câu tốt hơn
  const fixAllErrors = () => {
    if (!grammarErrors.errors || grammarErrors.errors.length === 0) return;
    
    let newText = text;
    
    // Sắp xếp lỗi theo vị trí bắt đầu giảm dần để tránh vấn đề khi thay thế text
    const sortedErrors = [...grammarErrors.errors].sort((a, b) => {
      const posA = newText.indexOf(a.word);
      const posB = newText.indexOf(b.word);
      return posB - posA;
    });
    
    // Sửa từng lỗi một, từ phải sang trái trong văn bản
    sortedErrors.forEach(error => {
      if (error.word === "[PUNCT]") {
        // Xử lý đặc biệt cho lỗi dấu câu
        if (error.position === "end") {
          // Nếu thiếu dấu câu ở cuối câu
          newText = newText.trimEnd() + error.suggestion;
        } else if (error.context) {
          // Xử lý thiếu dấu câu ở các vị trí khác dựa vào context
          const contextWithoutPunct = error.context.replace(/\[PUNCT\]/g, '').trim();
          if (contextWithoutPunct && newText.includes(contextWithoutPunct)) {
            const punctPos = newText.indexOf(contextWithoutPunct) + contextWithoutPunct.length;
            // Kiểm tra xem đã có dấu câu ở vị trí này chưa
            if (punctPos <= newText.length && newText[punctPos] !== error.suggestion) {
              newText = newText.substring(0, punctPos) + 
                      error.suggestion + 
                      newText.substring(punctPos);
            }
          }
        }
      } else {
        // Xử lý lỗi từ thông thường
        const escapedWord = error.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Sử dụng regex chính xác hơn cho từ
        const regex = new RegExp(escapedWord, 'g');
        newText = newText.replace(regex, error.suggestion);
      }
    });
    
    setText(newText);
    
    // Reset trạng thái lỗi và kích hoạt kiểm tra lại sau khi sửa
    setGrammarErrors({
      errorCount: 0,
      errors: [],
      checked: true,
      timestamp: Date.now() // Thêm timestamp giúp React nhận biết thay đổi
    });
    
    setShowErrorDetails(false);
    
    // Kích hoạt kiểm tra lỗi sau khi sửa với một chút delay
    setTimeout(() => {
      debouncedGrammarCheck.cancel();
      debouncedGrammarCheck(newText);
    }, 500);
  };

  const fixSingleError = (error) => {
    if (!error || !error.id) return;
    
    let newText = text;
    
    if (error.word === "[PUNCT]") {
      // Xử lý đặc biệt cho lỗi dấu câu
      if (error.position === "end") {
        // Nếu thiếu dấu câu ở cuối câu
        newText = newText.trimEnd() + error.suggestion;
      } else if (error.context) {
        // Xử lý thiếu dấu câu ở các vị trí khác dựa vào context
        const contextWithoutPunct = error.context.replace(/\[PUNCT\]/g, '').trim();
        if (contextWithoutPunct && newText.includes(contextWithoutPunct)) {
          const punctPos = newText.indexOf(contextWithoutPunct) + contextWithoutPunct.length;
          // Kiểm tra xem đã có dấu câu ở vị trí này chưa
          if (punctPos <= newText.length && newText[punctPos] !== error.suggestion) {
            newText = newText.substring(0, punctPos) + 
                    error.suggestion + 
                    newText.substring(punctPos);
          }
        }
      }
    } else {
      // Xử lý lỗi từ thông thường
      const escapedWord = error.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedWord, 'g');
      newText = newText.replace(regex, error.suggestion);
    }
    
    setText(newText);
    
    // Lọc lỗi đã sửa ra khỏi danh sách
    const updatedErrors = grammarErrors.errors.filter(e => e.id !== error.id);
    setGrammarErrors({
      errorCount: updatedErrors.length,
      errors: updatedErrors,
      checked: true,
      timestamp: Date.now() // Thêm timestamp
    });
    
    // Đóng modal nếu không còn lỗi nào
    if (updatedErrors.length === 0) {
      setShowErrorDetails(false);
    }
    
    // Kích hoạt kiểm tra lỗi sau khi sửa
    setTimeout(() => {
      debouncedGrammarCheck.cancel();
      debouncedGrammarCheck(newText);
    }, 500);
  };

  // Debounce cho dịch thuật
  const debouncedTranslate = debounce(async (text) => {
    if (!text.trim()) {
      setTranslatedText("");
      setSourceTextWithStress("");
      setPartsOfSpeech([]);
      setPhonetics([]); // Reset phonetics khi không có text
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateWithGemini(
        text,
        selectedSourceLang,
        selectedTargetLang
      );
      
      if (typeof result === 'object' && result.translation) {
        setTranslatedText(result.translation);
        setSourceTextWithStress(result.sourceTextWithStress || text);
        setPartsOfSpeech(result.partsOfSpeech || []);
        
        // Lưu phonetics từ kết quả API
        if (result.phonetics && result.phonetics.length > 0) {
          setPhonetics(result.phonetics);
          console.log("Phonetics received:", result.phonetics);
        } else {
          setPhonetics([]);
          console.log("No phonetics received");
        }
      } else {
        setTranslatedText(result);
        setSourceTextWithStress(text);
        setPartsOfSpeech([]);
        setPhonetics([]);
      }

      setError(null);
    } catch (err) {
      setError("Translation failed: " + err.message);
      console.error("Translation error:", err);
    } finally {
      setIsTranslating(false);
    }
  }, 1000);

  // Debounce cho kiểm tra lỗi - giảm thời gian xuống
  const debouncedGrammarCheck = debounce(async (text) => {
    if (!text.trim()) {
      setGrammarErrors({ errorCount: 0, errors: [], checked: false, timestamp: Date.now() });
      return;
    }
    
    try {
      const result = await checkGrammarWithGemini(text, selectedSourceLang);
      setGrammarErrors(result);
    } catch (err) {
      console.error("Grammar check error:", err);
      setGrammarErrors({ errorCount: 0, errors: [], checked: false, timestamp: Date.now() });
    }
  }, 800); // Giảm xuống 800ms thay vì 1500ms

  // Effect cho dịch thuật và kiểm tra lỗi
  useEffect(() => {
    if (autoTranslate && text.trim()) {
      debouncedTranslate(text);
    } else if (!text.trim()) {
      setTranslatedText("");
    }
    
    // Thêm kiểm tra lỗi
    if (text.trim()) {
      debouncedGrammarCheck(text);
    } else {
      setGrammarErrors({ errorCount: 0, errors: [], checked: false, timestamp: Date.now() });
    }
    
    return () => {
      debouncedTranslate.cancel();
      debouncedGrammarCheck.cancel();
    };
  }, [text, selectedSourceLang, selectedTargetLang, autoTranslate]);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    
    if (!newText.trim()) {
      setTranslatedText("");
      setSourceTextWithStress("");
      setPartsOfSpeech([]);
      setPhonetics([]);
      setGrammarErrors({ errorCount: 0, errors: [], checked: false, timestamp: Date.now() });
    }
  };

  const handleTranslate = () => {
    debouncedTranslate.cancel();
    debouncedTranslate(text);
  };

  const clearText = () => {
    setText("");
    setTranslatedText("");
    setSourceTextWithStress("");
    setPartsOfSpeech([]);
    setPhonetics([]);
    setGrammarErrors({ errorCount: 0, errors: [], checked: false, timestamp: Date.now() });
  };

  const swapLanguages = () => {
    if (selectedSourceLang === "Language detection") return;
    
    setSelectedSourceLang(selectedTargetLang);
    setSelectedTargetLang(selectedSourceLang);
    
    if (translatedText) {
      setText(translatedText);
      setTranslatedText(text);
      // Reset stress and parts of speech when swapping
      setSourceTextWithStress("");
      setPartsOfSpeech([]);
      setPhonetics([]);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-left">
          <button className="menu-button">☰</button>
          <div className="logo">
            <span className="google-logo">Google</span>
            <span className="translate-text">Translate</span>
          </div>
        </div>
        <div className="header-right">
          <button className="settings-button">⚙️</button>
          <div className="profile-circle"></div>
        </div>
      </header>

      <TranslationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="translation-section">
        {activeTab === "text" && (
          <>
            <div className="auto-translate-toggle">
              <label className="auto-translate-label">
                <input
                  type="checkbox"
                  checked={autoTranslate}
                  onChange={() => setAutoTranslate(!autoTranslate)}
                />
                <span className="toggle-text">Tự động dịch</span>
              </label>
            </div>
            <LanguageControls
              selectedSourceLang={selectedSourceLang}
              selectedTargetLang={selectedTargetLang}
              setSelectedSourceLang={setSelectedSourceLang}
              setSelectedTargetLang={setSelectedTargetLang}
              swapLanguages={swapLanguages}
            />
            <TranslationPanel
              text={text}
              translatedText={translatedText}
              sourceTextWithStress={sourceTextWithStress}
              partsOfSpeech={partsOfSpeech}
              phonetics={phonetics} // Truyền phonetics vào TranslationPanel
              handleTextChange={handleTextChange}
              charCount={text.length}
              clearText={clearText}
              handleTranslate={handleTranslate}
              isTranslating={isTranslating}
              error={error}
              autoTranslate={autoTranslate}
              selectedSourceLang={selectedSourceLang}
              selectedTargetLang={selectedTargetLang}
              grammarErrors={grammarErrors}
              toggleErrorDetails={() => setShowErrorDetails(!showErrorDetails)}
            />
          </>
        )}
        {activeTab === "document" && <DocumentTranslation />}
        {activeTab === "image" && <ImageTranslation />}
      </main>
      
      {/* Modal chi tiết lỗi */}
      {showErrorDetails && (
        <ErrorDetails 
          errors={grammarErrors.errors} 
          onClose={() => setShowErrorDetails(false)} 
          onFixAllErrors={fixAllErrors}
          onFixSingleError={fixSingleError}
        />
      )}
    </div>
  );
}

export default App;
