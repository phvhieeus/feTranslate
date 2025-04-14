// src/components/IdiomTranslation.jsx
import React, { useState, useEffect, useRef } from "react";
import { LanguageControls } from "./LanguageControls";
import { translateIdiomWithGemini } from "../services/openaiTranslation";
import debounce from "lodash.debounce";
import "../App.css"; // Import CSS để sử dụng các class chung

export function IdiomTranslation({
  selectedSourceLang,
  selectedTargetLang,
  setSelectedSourceLang,
  setSelectedTargetLang,
  swapLanguages, // swapLanguages function is passed from App.jsx
}) {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState({
    equivalentPhrase: "",
    explanation: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  // --- START: Added code for swap handling ---
  const prevSourceLangRef = useRef();
  const prevTargetLangRef = useRef();

  useEffect(() => {
    // Store previous language values before they update
    prevSourceLangRef.current = selectedSourceLang;
    prevTargetLangRef.current = selectedTargetLang;
  });

  const prevSourceLang = prevSourceLangRef.current;
  const prevTargetLang = prevTargetLangRef.current;

  useEffect(() => {
    // Detect if a language swap occurred
    if (
      prevSourceLang &&
      prevTargetLang &&
      selectedSourceLang === prevTargetLang &&
      selectedTargetLang === prevSourceLang
    ) {
      console.log("Detected language swap in IdiomTranslation");

      // Get current input and output
      const currentInput = inputText;
      const currentOutput = result.equivalentPhrase;

      // Only swap text if there was a previous output
      if (currentOutput) {
        // Set the old output as the new input
        setInputText(currentOutput);
        // Clear the previous result (explanation might be wrong after swap)
        // The main translation useEffect will trigger with the new inputText
        setResult({ equivalentPhrase: "", explanation: "" });
        setError(null); // Clear any previous error
        debouncedTranslate.cancel(); // Cancel any pending translation for the old input
      }
      // If there was no output, just the languages swap, input remains (or is empty)
    }
    // This effect runs when the selected languages change
  }, [selectedSourceLang, selectedTargetLang]);
  // --- END: Added code for swap handling ---

  // Debounce function for translation
  const debouncedTranslate = debounce(async (text, sourceLang, targetLang) => {
    if (!text.trim()) {
      setResult({ equivalentPhrase: "", explanation: "" });
      setError(null);
      setIsLoading(false); // Đảm bảo reset loading state
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log(
        `Translating idiom: "${text}" from ${sourceLang} to ${targetLang}`
      );
      const translationResult = await translateIdiomWithGemini(
        text,
        sourceLang,
        targetLang
      );
      console.log("Idiom translation result:", translationResult);
      // Only update if the result is for the current input text
      // This prevents race conditions if input changes quickly
      if (text === inputText) {
        setResult(translationResult);
      }
    } catch (err) {
      const errorMessage = `Lỗi dịch thành ngữ: ${err.message}`;
      // Only update if the error is for the current input text
      if (text === inputText) {
        setError(errorMessage);
        setResult({ equivalentPhrase: "", explanation: "" });
      }
      console.error("Idiom translation error:", err);
    } finally {
      // Only update if the loading state corresponds to the current input text
      if (text === inputText) {
        setIsLoading(false);
      }
    }
  }, 1000); // Delay 1 giây sau khi ngừng gõ

  // Trigger translation when input text or languages change
  useEffect(() => {
    // Chỉ dịch khi có input text
    if (inputText.trim()) {
      // Check if languages are valid before translating
      if (
        selectedSourceLang &&
        selectedTargetLang &&
        selectedSourceLang !== selectedTargetLang
      ) {
        debouncedTranslate(inputText, selectedSourceLang, selectedTargetLang);
      } else {
        // Handle invalid language selection if necessary
        console.warn("Invalid language selection for translation.");
        setResult({ equivalentPhrase: "", explanation: "" });
        setError("Vui lòng chọn ngôn ngữ nguồn và đích hợp lệ.");
        debouncedTranslate.cancel();
      }
    } else {
      // Clear kết quả nếu input rỗng
      setResult({ equivalentPhrase: "", explanation: "" });
      setError(null);
      debouncedTranslate.cancel(); // Hủy debounce nếu input rỗng
    }
    // Cleanup function to cancel debounce on unmount or change
    return () => {
      debouncedTranslate.cancel();
    };
    // Add inputText to dependency array
  }, [inputText, selectedSourceLang, selectedTargetLang]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height first
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const clearInput = () => {
    setInputText("");
    setResult({ equivalentPhrase: "", explanation: "" });
    setError(null);
    debouncedTranslate.cancel(); // Hủy debounce khi xóa
  };

  // Hàm dịch thủ công khi nhấn nút
  const handleManualTranslate = () => {
    debouncedTranslate.cancel(); // Cancel any pending debounce
    // Gọi hàm dịch ngay lập tức (không cần debounce ở đây)
    if (inputText.trim()) {
      // Check if languages are valid before translating
      if (
        selectedSourceLang &&
        selectedTargetLang &&
        selectedSourceLang !== selectedTargetLang
      ) {
        setIsLoading(true); // Bắt đầu loading
        setError(null);
        translateIdiomWithGemini(
          inputText,
          selectedSourceLang,
          selectedTargetLang
        )
          .then((translationResult) => {
            setResult(translationResult);
          })
          .catch((err) => {
            setError(`Lỗi dịch thành ngữ: ${err.message}`);
            setResult({ equivalentPhrase: "", explanation: "" });
            console.error("Manual Idiom translation error:", err);
          })
          .finally(() => {
            setIsLoading(false); // Kết thúc loading
          });
      } else {
        setError("Vui lòng chọn ngôn ngữ nguồn và đích hợp lệ.");
        setResult({ equivalentPhrase: "", explanation: "" });
      }
    } else {
      // Clear kết quả nếu input rỗng
      setResult({ equivalentPhrase: "", explanation: "" });
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
        swapLanguages={swapLanguages} // Pass the swap function down
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
            <span className="char-count">{inputText.length}/500</span>{" "}
            {/* Giới hạn ký tự nếu cần */}
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
                  <div className="idiom-no-result">
                    Không tìm thấy thành ngữ tương đương phù hợp hoặc có lỗi xảy
                    ra.
                  </div>
                )}
                {/* Placeholder khi không có input */}
                {!inputText.trim() && (
                  <div className="idiom-placeholder">
                    Nhập thành ngữ hoặc câu vào ô bên trái để xem kết quả...
                  </div>
                )}
              </>
            )}
            {/* Có thể thêm spinner khi đang loading */}
            {isLoading && (
              <div className="idiom-placeholder">Đang tìm kiếm...</div>
            )}
          </div>
          {/* Controls cho output */}
          <div className="text-controls">
            <div className="text-buttons">
              {/* Nút copy chỉ hiển thị khi có kết quả */}
              {!isLoading && result.equivalentPhrase && (
                <button
                  className="copy-button" // Sử dụng class chung
                  onClick={() =>
                    navigator.clipboard.writeText(result.equivalentPhrase)
                  }
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
