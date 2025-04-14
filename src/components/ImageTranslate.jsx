// src/components/ImageTranslate.jsx
import React, { useState, useRef, useEffect } from "react";
import Tesseract from "tesseract.js";
// Thay đổi import để lấy hàm dịch thông thường, không phải hàm idiom
import { translateWithGemini } from "../services/openaiTranslation";

export function ImageTranslation() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSourceLang, setSelectedSourceLang] = useState("English");
  const [selectedTargetLang, setSelectedTargetLang] = useState("Vietnamese");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("original"); // "original" or "translated"

  const fileInputRef = useRef(null);
  const pasteAreaRef = useRef(null);

  // Supported languages
  const supportedLanguages = [
    { value: "English", label: "Tiếng Anh" },
    { value: "Vietnamese", label: "Tiếng Việt" },
    { value: "Chinese", label: "Tiếng Trung" },
    { value: "Japanese", label: "Tiếng Nhật" },
    { value: "Korean", label: "Tiếng Hàn" },
    { value: "French", label: "Tiếng Pháp" },
    { value: "German", label: "Tiếng Đức" },
    { value: "Spanish", label: "Tiếng Tây Ban Nha" },
  ];

  // Effect to update target language if it's the same as source language
  useEffect(() => {
    if (selectedSourceLang === selectedTargetLang) {
      const differentLang = supportedLanguages.find(
        (lang) => lang.value !== selectedSourceLang
      );
      if (differentLang) {
        setSelectedTargetLang(differentLang.value);
      }
    }
  }, [selectedSourceLang, supportedLanguages]); // Thêm supportedLanguages vào dependencies

  // --- START: Added Effect ---
  // Effect to clear extracted text when source language changes, forcing re-OCR
  useEffect(() => {
    // Only clear if an image is selected to avoid clearing initially
    if (selectedImage) {
      console.log(
        "Source language changed, clearing extracted text for re-OCR."
      );
      setExtractedText("");
      setTranslatedText(""); // Also clear translation
      setActiveTab("original"); // Reset tab
    }
    // This effect depends only on selectedSourceLang and selectedImage presence
  }, [selectedSourceLang]);
  // --- END: Added Effect ---

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Handle paste from clipboard
  const handlePaste = (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        processImageFile(blob);
        break;
      }
    }
  };

  // Process the selected image file
  const processImageFile = (file) => {
    if (!file) return;

    if (!file.type.match("image.*")) {
      setError("Please select an image file (JPG, PNG, GIF, BMP, WEBP)");
      return;
    }
    // Revoke the old object URL if it exists before creating a new one
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const imageUrl = URL.createObjectURL(file);
    setPreviewUrl(imageUrl);
    setSelectedImage(file);
    setExtractedText(""); // Clear previous extracted text when a new image is loaded
    setTranslatedText(""); // Clear previous translation
    setError(null);
    setActiveTab("original"); // Reset về tab original khi có ảnh mới
  };

  // --- START: Updated extractTextFromImage function ---
  // Extract text from image using OCR and/or translate
  const extractTextFromImage = async () => {
    if (!previewUrl || !selectedImage) return;

    setIsProcessing(true);
    setOcrProgress(0); // Reset OCR progress indicator
    setError(null);
    // Keep existing extractedText for potential re-translation

    try {
      // Check if we already have extracted text for the current image/source language
      if (extractedText && extractedText.trim()) {
        console.log(
          "Existing extracted text found. Skipping OCR, proceeding to translation."
        );
        setTranslatedText(""); // Clear previous translation before new one
        setActiveTab("original"); // Show original while translating

        try {
          // Translate the existing text to the new target language
          const translationResult = await translateWithGemini(
            extractedText,
            selectedSourceLang,
            selectedTargetLang
          );

          console.log("Re-translation API Result:", translationResult);

          if (
            translationResult &&
            typeof translationResult === "object" &&
            translationResult.translation
          ) {
            setTranslatedText(translationResult.translation);
            setActiveTab("translated"); // Switch to translated tab after success
          } else {
            // Handle unexpected format from re-translation
            const fallbackTranslation =
              translationResult?.translation ||
              (typeof translationResult === "string"
                ? translationResult
                : "Re-translation format error.");
            setTranslatedText(fallbackTranslation);
            setError("Received an unexpected format during re-translation.");
            setActiveTab("translated");
          }
        } catch (translationError) {
          console.error("Re-translation API error:", translationError);
          setError(`Error re-translating text: ${translationError.message}`);
          setTranslatedText(""); // Clear translation on error
          setActiveTab("original"); // Stay on original tab if re-translation fails
        }
        // Skip the OCR part below if re-translation was attempted
      } else {
        // --- Perform OCR if no extracted text exists ---
        console.log(
          "No existing text for current image/source. Performing OCR."
        );
        setExtractedText(""); // Ensure extractedText is clear before OCR
        setTranslatedText(""); // Clear any old translation
        setActiveTab("original"); // Start on original tab

        // Determine OCR language
        const langMap = {
          English: "eng",
          Vietnamese: "vie",
          Chinese: "chi_sim",
          Japanese: "jpn",
          Korean: "kor",
          French: "fra",
          German: "deu",
          Spanish: "spa",
        };
        const ocrLang = langMap[selectedSourceLang] || "eng";
        console.log(`Starting OCR with language: ${ocrLang}`);

        // Run Tesseract OCR
        const result = await Tesseract.recognize(previewUrl, ocrLang, {
          logger: (info) => {
            if (info.status === "recognizing text") {
              setOcrProgress(Math.round(info.progress * 100));
            }
            console.log("Tesseract progress:", info);
          },
        });

        console.log("OCR Result:", result);
        const text = result.data.text;
        setExtractedText(text); // Set the newly extracted text
        setActiveTab("original"); // Stay on original tab after OCR

        // Translate the newly extracted text if it's not empty
        if (text && text.trim()) {
          console.log(
            `Translating text from ${selectedSourceLang} to ${selectedTargetLang}`
          );
          try {
            const translationResult = await translateWithGemini(
              text,
              selectedSourceLang,
              selectedTargetLang
            );

            console.log("Translation API Result:", translationResult);

            if (
              translationResult &&
              typeof translationResult === "object" &&
              translationResult.translation
            ) {
              setTranslatedText(translationResult.translation);
              setActiveTab("translated");
            } else {
              // Handle unexpected format from initial translation
              const fallbackTranslation =
                translationResult?.translation ||
                (typeof translationResult === "string"
                  ? translationResult
                  : "Translation format error.");
              setTranslatedText(fallbackTranslation);
              setError(
                "Received an unexpected format from the translation service."
              );
              setActiveTab("translated");
            }
          } catch (translationError) {
            console.error("Translation API error:", translationError);
            setError(`Error translating text: ${translationError.message}`);
            setTranslatedText("");
            setActiveTab("original");
          }
        } else {
          console.log("No text extracted from image to translate.");
          setTranslatedText(""); // Ensure translation is empty if no text extracted
        }
      }
    } catch (err) {
      // Catch errors specifically from the OCR process (Tesseract.recognize)
      console.error("OCR error:", err);
      setError(`Error processing image (OCR): ${err.message || err}`);
      setExtractedText(""); // Clear text if OCR failed
      setTranslatedText(""); // Clear translation if OCR failed
      setActiveTab("original");
    } finally {
      // This runs after either OCR+Translate or just Translate finishes/errors
      setIsProcessing(false);
      setOcrProgress(0); // Reset progress indicator after all operations
    }
  };
  // --- END: Updated extractTextFromImage function ---

  // Handle source language change
  const handleSourceLanguageChange = (e) => {
    setSelectedSourceLang(e.target.value);
    // The useEffect hook handles clearing extractedText now
  };

  // Handle target language change
  const handleTargetLanguageChange = (e) => {
    setSelectedTargetLang(e.target.value);
    // If text is already extracted, clicking the button again will now re-translate
  };

  // Get available target languages (exclude the source language)
  const getTargetLanguages = () => {
    return supportedLanguages.filter(
      (lang) => lang.value !== selectedSourceLang
    );
  };

  // Handle browse button click
  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  // Handle clipboard button click
  const handleClipboardClick = () => {
    if (pasteAreaRef.current) {
      pasteAreaRef.current.focus();
      alert("Please paste the image now (Ctrl+V or Cmd+V).");
    }
  };

  // Handle clear image button click
  const handleClearImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
    setExtractedText("");
    setTranslatedText("");
    setError(null);
    setOcrProgress(0);
    setActiveTab("original");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle copy text button click
  const handleCopyText = (textToCopy) => {
    if (!textToCopy) return;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        alert("Text copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        alert("Failed to copy text.");
      });
  };

  // Prevent default behavior for drag and drop
  const preventDefault = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Swap languages
  const swapLanguages = () => {
    const tempSource = selectedSourceLang;
    setSelectedSourceLang(selectedTargetLang);
    setSelectedTargetLang(tempSource);
    // The useEffect for selectedSourceLang will clear extractedText, forcing re-OCR if needed.
    // If only target changes, the button logic handles re-translation.
  };

  return (
    <div className="image-translation">
      {!previewUrl ? (
        <div
          className="upload-area"
          onDrop={handleDrop}
          onDragOver={preventDefault}
          onDragEnter={preventDefault}
          onPaste={handlePaste}
          ref={pasteAreaRef}
          tabIndex="0"
          aria-label="Image upload area: Drag and drop, paste, or browse to upload an image."
        >
          <div className="upload-cloud-icon">
            <span role="img" aria-label="upload">
              🖼️
            </span>
          </div>
          <div className="upload-text">
            Drag and drop or paste an image here
          </div>
          <div className="upload-options">
            <button className="upload-btn" onClick={handleBrowseClick}>
              Select an image from your device
            </button>
            <button
              className="clipboard-btn"
              onClick={handleClipboardClick}
              title="Click to focus, then paste (Ctrl+V)"
            >
              <span className="clipboard-icon">📋</span>
              Paste image from clipboard
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/gif, image/bmp, image/webp"
              className="hidden-file-input"
            />
            <div className="supported-formats">
              Support: JPG, PNG, GIF, BMP, WEBP
            </div>
          </div>
        </div>
      ) : (
        <div className="image-translation-result">
          <div className="image-translation-header">
            {/* Language Selection */}
            <div className="language-selection">
              <div className="language-selector">
                <label htmlFor="source-lang-select-img">
                  Language in image:
                </label>
                <select
                  id="source-lang-select-img"
                  value={selectedSourceLang}
                  onChange={handleSourceLanguageChange}
                  disabled={isProcessing} // Disable during processing
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="language-swap">
                <button
                  className="swap-button"
                  onClick={swapLanguages}
                  title="Swap languages"
                  disabled={isProcessing} // Disable during processing
                >
                  ⇄
                </button>
              </div>
              <div className="language-selector">
                <label htmlFor="target-lang-select-img">Translate to:</label>
                <select
                  id="target-lang-select-img"
                  value={selectedTargetLang}
                  onChange={handleTargetLanguageChange}
                  disabled={isProcessing} // Disable during processing
                >
                  {getTargetLanguages().map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Image Actions */}
            <div className="image-actions">
              <button
                className="translate-button"
                onClick={extractTextFromImage}
                disabled={isProcessing || !selectedImage}
              >
                {isProcessing
                  ? `Processing... ${ocrProgress > 0 ? ocrProgress + "%" : ""}` // Show progress only if OCR is running
                  : extractedText // Change button text based on whether OCR is needed
                  ? "Translate to new language"
                  : "Extract & Translate"}
              </button>
              <button
                className="clear-button"
                onClick={handleClearImage}
                title="Remove image"
                disabled={isProcessing} // Disable during processing
              >
                Delete image
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="image-translation-content">
            {/* Image Preview */}
            <div className="image-preview-container">
              <img
                src={previewUrl}
                alt="Selected preview"
                className="image-preview"
              />
            </div>

            {/* Text Results */}
            <div className="text-result-container">
              <div className="text-result-tabs">
                <button
                  className={`tab-button ${
                    activeTab === "original" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("original")}
                  disabled={isProcessing}
                >
                  Original text
                </button>
                <button
                  className={`tab-button ${
                    activeTab === "translated" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("translated")}
                  disabled={isProcessing}
                >
                  Translation
                </button>
              </div>

              <div className="text-result-content">
                {activeTab === "original" ? (
                  <div className="text-result">
                    <textarea
                      value={extractedText}
                      readOnly
                      placeholder={
                        isProcessing && !extractedText // Show extracting only if OCR is actually running
                          ? "Extracting text..."
                          : "Text extracted from the image will appear here..."
                      }
                      className="text-result-area"
                      aria-label="Extracted text from image"
                    />
                    {extractedText && !isProcessing && (
                      <button
                        className="copy-button"
                        onClick={() => handleCopyText(extractedText)}
                        title="Copy original text"
                      >
                        📋 Copy original text
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-result">
                    <textarea
                      value={translatedText}
                      readOnly
                      placeholder={
                        isProcessing
                          ? "Translating..."
                          : "The translation will appear here..."
                      }
                      className="text-result-area"
                      aria-label="Translated text"
                    />
                    {translatedText && !isProcessing && (
                      <button
                        className="copy-button"
                        onClick={() => handleCopyText(translatedText)}
                        title="Copy translated text"
                      >
                        📋 Copy translation
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}
        </div>
      )}
    </div>
  );
}
