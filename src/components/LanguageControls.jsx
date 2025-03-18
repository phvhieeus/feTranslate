import React, { useState } from "react";

export function LanguageControls({
  selectedSourceLang,
  selectedTargetLang,
  setSelectedSourceLang,
  setSelectedTargetLang,
  swapLanguages
}) {
  const [showSourceOptions, setShowSourceOptions] = useState(false);
  const [showTargetOptions, setShowTargetOptions] = useState(false);

  // Danh sách ngôn ngữ hỗ trợ mặc định
  const defaultSupportedLanguages = [
    { value: "English", label: "Tiếng Anh" },
    { value: "Vietnamese", label: "Tiếng Việt" },
    { value: "Chinese", label: "Tiếng Trung" },
    { value: "French", label: "Tiếng Pháp" },
    { value: "German", label: "Tiếng Đức" },
    { value: "Japanese", label: "Tiếng Nhật" },
    { value: "Korean", label: "Tiếng Hàn" },
    { value: "Spanish", label: "Tiếng Tây Ban Nha" }
  ];

  const supportedLanguages = defaultSupportedLanguages;

  const handleSourceLanguageSelect = (lang) => {
    setSelectedSourceLang(lang);
    setShowSourceOptions(false);
  };

  const handleTargetLanguageSelect = (lang) => {
    setSelectedTargetLang(lang);
    setShowTargetOptions(false);
  };

  // Hàm lấy danh sách ngôn ngữ đích (loại bỏ ngôn ngữ nguồn)
  const getTargetLanguages = () => {
    return supportedLanguages.filter(lang => lang.value !== selectedSourceLang);
  };

  return (
    <div className="language-container">
      <div className="language-selection-area">
        <div className="language-section">
          <div
            className="selected-language"
            onClick={() => setShowSourceOptions(!showSourceOptions)}
          >
            {selectedSourceLang}
            <span className="dropdown-arrow">▼</span>
          </div>
          {showSourceOptions && (
            <div className="language-options">
              <div className="language-options-grid">
                {supportedLanguages.map((lang) => (
                  <div
                    key={lang.value}
                    className={`language-option ${
                      selectedSourceLang === lang.value ? "active" : ""
                    }`}
                    onClick={() => handleSourceLanguageSelect(lang.value)}
                  >
                    {lang.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button className="swap-button" onClick={swapLanguages}>
          <span className="swap-icon">⇄</span>
        </button>

        <div className="language-section">
          <div
            className="selected-language"
            onClick={() => setShowTargetOptions(!showTargetOptions)}
          >
            {selectedTargetLang}
            <span className="dropdown-arrow">▼</span>
          </div>
          {showTargetOptions && (
            <div className="language-options">
              <div className="language-options-grid">
                {getTargetLanguages().map((lang) => (
                  <div
                    key={lang.value}
                    className={`language-option ${
                      selectedTargetLang === lang.value ? "active" : ""
                    }`}
                    onClick={() => handleTargetLanguageSelect(lang.value)}
                  >
                    {lang.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
