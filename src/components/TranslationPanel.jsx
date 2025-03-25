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
  const [showWordCategories, setShowWordCategories] = useState(true);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const textareaRef = useRef(null);

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
      console.error('The browser does not support speech');
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
      console.error('The browser does not support speech');
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
              Detected {grammarErrors.errorCount} errors in your text.
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
              placeholder="Enter the text to be translated"
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
                title="Pronounce the original text"
                disabled={isSpeakingSource || isSpeakingTarget}
              >
                {isSpeakingSource ? '🔊' : '🔈'}
              </button>
            )}
            
            <button
              className={`mic-button ${isListening ? 'mic-active' : ''}`}
              onClick={toggleListening}
              title={isListening ? "Stop recording" : "Voice input"}
            >
              {isListening ? '🔴 🎤' : '🎤'}
            </button>
            
            {!autoTranslate && (
              <button 
                className="translate-button" 
                onClick={handleTranslate} 
                disabled={!text.trim() || isTranslating}
              >
                {isTranslating ? "Translating..." : "Translate"}
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
          {isTranslating && <span className="translating">(Translating...)</span>}
        </div>
        
        {/* Bản dịch thông thường */}
        <textarea
          className="target-text"
          value={translatedText}
          readOnly
        ></textarea>
        
        {/* Hiển thị từ loại */}
        {translatedText && partsOfSpeech && partsOfSpeech.length > 0 && (
          <>
            {/* Thêm toggle hiển thị từ loại */}
            <div className="text-enhancement-toggle">
              <label className="category-toggle-label">
                <input
                  type="checkbox"
                  checked={showWordCategories}
                  onChange={() => setShowWordCategories(!showWordCategories)}
                />
                <span className="toggle-text">Show word type</span>
              </label>
            </div>
            
            {showWordCategories && (
              <div className="word-categories-container">
                <WordCategories
                  translation={translatedText}
                  partsOfSpeech={partsOfSpeech}
                />
              </div>
            )}
          </>
        )}
        
        <div className="text-controls">
          <div className="text-buttons">
            {translatedText && (
              <button 
                className={`speak-button ${isSpeakingTarget ? 'speaking' : ''}`} 
                onClick={speakTargetText}
                title="Pronounce translation"
                disabled={isSpeakingSource || isSpeakingTarget}
              >
                {isSpeakingTarget ? '🔊' : '🔈'}
              </button>
            )}
            {translatedText && (
              <button 
                className="copy-button" 
                onClick={() => navigator.clipboard.writeText(translatedText)}
                title="Copy translation"
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
