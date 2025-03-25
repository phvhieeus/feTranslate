import React, { useState, useEffect, useRef } from "react";
import { TextWithStress } from "./TextWithStress";
import { WordCategories } from "./WordCategories";

export function TranslationPanel({
  text,
  translatedText,
  sourceTextWithStress,
  partsOfSpeech,
  phonetics,
  handleTextChange,
  charCount,
  clearText,
  handleTranslate,
  isTranslating,
  error,
  autoTranslate,
  selectedSourceLang,
  selectedTargetLang,
  grammarErrors,
  toggleErrorDetails
}) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isSpeakingSource, setIsSpeakingSource] = useState(false);
  const [isSpeakingTarget, setIsSpeakingTarget] = useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const textareaRef = useRef(null);

  // Check if input is a single word
  const isSingleWord = text.trim().split(/\s+/).length === 1 && text.trim().length > 0;

  // Define language mapping for speech synthesis
  const langMap = {
    'Vietnamese': 'vi-VN',
    'English': 'en-US',
    'Chinese': 'zh-CN',
    'French': 'fr-FR',
    'German': 'de-DE',
    'Japanese': 'ja-JP',
    'Korean': 'ko-KR',
    'Spanish': 'es-ES'
  };

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      
      // Set recognition language based on source language
      recognitionInstance.lang = langMap[selectedSourceLang] || 'vi-VN';
      
      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        // Update the text by combining existing text with new transcript
        const updatedText = text + ' ' + transcript;
        // Call the parent component's text change handler
        handleTextChange({ target: { value: updatedText.trim() } });
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
    
    // Cleanup function
    return () => {
      if (recognition) {
        recognition.stop();
      }
      // Stop speech synthesis when component unmounts
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedSourceLang]); // Re-initialize when source language changes

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const toggleListening = () => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  // Function to speak source text
  const speakSourceText = () => {
    if (!text || isSpeakingSource || isSpeakingTarget) return;
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set speech language based on source language
      utterance.lang = langMap[selectedSourceLang] || 'en-US';
      
      // Find appropriate voice for the language
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.includes(utterance.lang.split('-')[0]));
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.onstart = () => setIsSpeakingSource(true);
      utterance.onend = () => setIsSpeakingSource(false);
      utterance.onerror = () => setIsSpeakingSource(false);
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Trình duyệt không hỗ trợ phát âm');
    }
  };

  // Function to speak translated text
  const speakTargetText = () => {
    if (!translatedText || isSpeakingSource || isSpeakingTarget) return;
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(translatedText);
      
      // Set speech language based on target language
      utterance.lang = langMap[selectedTargetLang] || 'en-US';
      
      // Find appropriate voice for the language
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.includes(utterance.lang.split('-')[0]));
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.onstart = () => setIsSpeakingTarget(true);
      utterance.onend = () => setIsSpeakingTarget(false);
      utterance.onerror = () => setIsSpeakingTarget(false);
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Trình duyệt không hỗ trợ phát âm');
    }
  };

  // Xử lý khi click vào container để focus vào textarea
  const handleContainerClick = () => {
    if (textareaRef.current && !isTextareaFocused) {
      textareaRef.current.focus();
    }
  };

  // Hiển thị phiên âm và trọng âm bên dưới textarea
  const renderPhonetics = () => {
    if (!text || !sourceTextWithStress || !phonetics || phonetics.length === 0) return null;
    
    return (
      <div className="phonetics-display">
        <TextWithStress 
          text={sourceTextWithStress} 
          language={langMap[selectedSourceLang] || 'en-US'} 
          phonetics={phonetics}
        />
      </div>
    );
  };

  return (
    <div className="text-areas-container">
      {/* Source text area */}
      <div className="text-area-wrapper">
        <div className="source-text-container">
          {/* Thêm banner cảnh báo lỗi */}
          {grammarErrors.errorCount > 0 && (
            <div className="grammar-error-banner">
              <span className="error-icon">⚠️</span>
              <span className="error-count">
                Phát hiện {grammarErrors.errorCount} lỗi trong văn bản của bạn
              </span>
              <button 
                className="view-errors-button" 
                onClick={toggleErrorDetails}
              >
                Xem
              </button>
            </div>
          )}
          
          {/* Luôn hiển thị textarea để nhập văn bản */}
          <div 
            className={`input-container ${isTextareaFocused ? 'focused' : ''}`}
            onClick={handleContainerClick}
          >
            <textarea
              ref={textareaRef}
              className="source-text"
              placeholder="Nhập văn bản cần dịch"
              value={text}
              onChange={handleTextChange}
              onFocus={() => setIsTextareaFocused(true)}
              onBlur={() => setIsTextareaFocused(false)}
            ></textarea>
          </div>
          
          {/* Hiển thị phiên âm và trọng âm bên dưới textarea */}
          {renderPhonetics()}
        </div>
        
        <div className="text-controls">
          <span className="char-count">{charCount}/5000</span>
          <div className="text-buttons">
            {text && (
              <button 
                className={`speak-button ${isSpeakingSource ? 'speaking' : ''}`} 
                onClick={speakSourceText}
                title="Phát âm văn bản gốc"
                disabled={isSpeakingSource || isSpeakingTarget}
              >
                {isSpeakingSource ? '🔊' : '🔈'}
              </button>
            )}
            
            <button
              className={`mic-button ${isListening ? 'mic-active' : ''}`}
              onClick={toggleListening}
              title={isListening ? "Dừng ghi âm" : "Nhập bằng giọng nói"}
            >
              {isListening ? '🔴 🎤' : '🎤'}
            </button>
            
            {!autoTranslate && (
              <button 
                className="translate-button" 
                onClick={handleTranslate} 
                disabled={!text.trim() || isTranslating}
              >
                {isTranslating ? "Đang dịch..." : "Dịch"}
              </button>
            )}
            <button 
              className="clear-button" 
              onClick={clearText}
            >
              ✕
            </button>
          </div>
        </div>
      </div>
      
      {/* Target text area */}
      <div className="text-area-wrapper">
        <div className="target-header">
          <span className="target-language-label">{selectedTargetLang}</span>
          {isTranslating && <span className="translating">(đang dịch...)</span>}
        </div>
        
        {/* Target content container */}
        <div className="target-content">
          {/* Bản dịch thông thường */}
          <textarea
            className="target-text"
            value={translatedText}
            readOnly
          ></textarea>
          
          {/* Hiển thị từ loại chỉ khi nhập một từ duy nhất - tự động hiển thị không cần toggle */}
          {translatedText && partsOfSpeech && partsOfSpeech.length > 0 && isSingleWord && (
            <div className="word-categories-container">
              <h3 className="categories-title">Phân loại từ</h3>
              <WordCategories
                translation={translatedText}
                partsOfSpeech={partsOfSpeech}
              />
            </div>
          )}
        </div>
        
        <div className="text-controls">
          <div className="text-buttons">
            {translatedText && (
              <button 
                className={`speak-button ${isSpeakingTarget ? 'speaking' : ''}`} 
                onClick={speakTargetText}
                title="Phát âm bản dịch"
                disabled={isSpeakingSource || isSpeakingTarget}
              >
                {isSpeakingTarget ? '🔊' : '🔈'}
              </button>
            )}
            {translatedText && (
              <button 
                className="copy-button" 
                onClick={() => navigator.clipboard.writeText(translatedText)}
                title="Sao chép bản dịch"
              >
                📋
              </button>
            )}
          </div>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
