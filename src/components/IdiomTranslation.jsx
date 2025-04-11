// src/components/IdiomTranslation.jsx
import React, { useState, useEffect, useRef } from 'react';
import { LanguageControls } from './LanguageControls';
import { translateIdiomWithGemini } from '../services/openaiTranslation';
import debounce from 'lodash.debounce';
import '../App.css'; // Import CSS để sử dụng các class chung

export function IdiomTranslation({
  selectedSourceLang,
  selectedTargetLang,
  setSelectedSourceLang,
  setSelectedTargetLang,
  swapLanguages
}) {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState({ equivalentPhrase: '', explanation: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  // Debounce function for translation
  const debouncedTranslate = debounce(async (text, sourceLang, targetLang) => {
    if (!text.trim()) {
      setResult({ equivalentPhrase: '', explanation: '' });
      setError(null);
      setIsLoading(false); // Đảm bảo reset loading state
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log(`Translating idiom: "${text}" from ${sourceLang} to ${targetLang}`);
      const translationResult = await translateIdiomWithGemini(text, sourceLang, targetLang);
      console.log("Idiom translation result:", translationResult);
      setResult(translationResult);
    } catch (err) {
      const errorMessage = `Lỗi dịch thành ngữ: ${err.message}`;
      setError(errorMessage);
      setResult({ equivalentPhrase: '', explanation: '' });
      console.error("Idiom translation error:", err);
    } finally {
      setIsLoading(false);
    }
  }, 1000); // Delay 1 giây sau khi ngừng gõ

  // Trigger translation when input text or languages change
  useEffect(() => {
    // Chỉ dịch khi có input text
    if (inputText.trim()) {
        debouncedTranslate(inputText, selectedSourceLang, selectedTargetLang);
    } else {
        // Clear kết quả nếu input rỗng
        setResult({ equivalentPhrase: '', explanation: '' });
        setError(null);
        debouncedTranslate.cancel(); // Hủy debounce nếu input rỗng
    }
    // Cleanup function to cancel debounce on unmount or change
    return () => {
      debouncedTranslate.cancel();
    };
  }, [inputText, selectedSourceLang, selectedTargetLang]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height first
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const clearInput = () => {
    setInputText('');
    setResult({ equivalentPhrase: '', explanation: '' });
    setError(null);
    debouncedTranslate.cancel(); // Hủy debounce khi xóa
  };

  // Hàm dịch thủ công khi nhấn nút
  const handleManualTranslate = () => {
    debouncedTranslate.cancel(); // Cancel any pending debounce
    // Gọi hàm dịch ngay lập tức (không cần debounce ở đây)
    if (inputText.trim()) {
        setIsLoading(true); // Bắt đầu loading
        setError(null);
        translateIdiomWithGemini(inputText, selectedSourceLang, selectedTargetLang)
            .then(translationResult => {
                setResult(translationResult);
            })
            .catch(err => {
                setError(`Lỗi dịch thành ngữ: ${err.message}`);
                setResult({ equivalentPhrase: '', explanation: '' });
                console.error("Manual Idiom translation error:", err);
            })
            .finally(() => {
                setIsLoading(false); // Kết thúc loading
            });
    } else {
        // Clear kết quả nếu input rỗng
        setResult({ equivalentPhrase: '', explanation: '' });
        setError(null);
    }
  };

  return (
    <div className="idiom-translation-container">
      <LanguageControls
        selectedSourceLang={selectedSourceLang}
        selectedTargetLang={selectedTargetLang}
        setSelectedSourceLang={setSelectedSourceLang}
        setSelectedTargetLang={setSelectedTargetLang}
        swapLanguages={swapLanguages}
      />

      <div className="idiom-text-areas">
        {/* Input Area */}
        <div className="text-area-wrapper">
          <textarea
            ref={textareaRef}
            className="source-text idiom-input" // Sử dụng class chung và class riêng
            placeholder={`Nhập thành ngữ hoặc câu bằng ${selectedSourceLang}...`}
            value={inputText}
            onChange={handleInputChange}
            rows={5} // Số dòng mặc định, sẽ tự điều chỉnh
          />
          <div className="text-controls">
            <span className="char-count">{inputText.length}/500</span> {/* Giới hạn ký tự nếu cần */}
            <div className="text-buttons">
              {/* Nút dịch thủ công */}
              <button
                className="translate-button" // Sử dụng class chung
                onClick={handleManualTranslate}
                disabled={!inputText.trim() || isLoading}
                title="Dịch thành ngữ"
              >
                {isLoading ? "Đang tìm..." : "Dịch"}
              </button>
              {/* Nút xóa */}
              {inputText && (
                <button
                  className="clear-button" // Sử dụng class chung
                  onClick={clearInput}
                  title="Xóa"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Output Area */}
        <div className="text-area-wrapper idiom-output-wrapper">
           <div className="target-header">
             <span className="target-language-label">{selectedTargetLang}</span>
             {isLoading && <span className="translating"> (đang tìm...)</span>}
           </div>
           <div className="idiom-result-content">
             {/* Hiển thị lỗi nếu có */}
             {error && <div className="error-message">{error}</div>}

             {/* Hiển thị kết quả nếu không loading và không có lỗi */}
             {!isLoading && !error && (
                <>
                    {result.equivalentPhrase && (
                    <div className="idiom-equivalent">
                        <strong>Câu/Thành ngữ tương đương:</strong>
                        <p>{result.equivalentPhrase}</p>
                    </div>
                    )}
                    {result.explanation && (
                    <div className="idiom-explanation">
                        <strong>Giải thích:</strong>
                        <p>{result.explanation}</p>
                    </div>
                    )}
                    {/* Thông báo nếu có input nhưng không có kết quả */}
                    {!result.equivalentPhrase && inputText.trim() && (
                        <div className="idiom-no-result">Không tìm thấy thành ngữ tương đương phù hợp hoặc có lỗi xảy ra.</div>
                    )}
                    {/* Placeholder khi không có input */}
                    {!inputText.trim() && (
                        <div className="idiom-placeholder">Nhập thành ngữ hoặc câu vào ô bên trái để xem kết quả...</div>
                    )}
                </>
             )}
             {/* Có thể thêm spinner khi đang loading */}
             {isLoading && <div className="idiom-placeholder">Đang tìm kiếm...</div>}

           </div>
           {/* Controls cho output */}
           <div className="text-controls">
             <div className="text-buttons">
                {/* Nút copy chỉ hiển thị khi có kết quả */}
                {!isLoading && result.equivalentPhrase && (
                    <button
                        className="copy-button" // Sử dụng class chung
                        onClick={() => navigator.clipboard.writeText(result.equivalentPhrase)}
                        title="Sao chép câu tương đương"
                    >
                        📋
                    </button>
                )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
