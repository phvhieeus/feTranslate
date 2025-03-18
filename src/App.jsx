import React, { useState, useEffect } from "react";
import { TranslationTabs } from "./components/TranslationTabs";
import { LanguageControls } from "./components/LanguageControls";
import { TranslationPanel } from "./components/TranslationPanel";
import { ImageTranslation } from "./components/ImageTranslate";
import AuthForm from "./components/AuthForm"; // Giữ nguyên import
import { DocumentTranslation } from "./components/DocumentTranslation";
import { translateWithGemini } from "./services/openaiTranslation";
import debounce from "lodash.debounce";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("text");
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [selectedSourceLang, setSelectedSourceLang] = useState("English");
  const [selectedTargetLang, setSelectedTargetLang] = useState("Vietnamese");
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);

  // Debounce the translation function
  const debouncedTranslate = debounce(async (text) => {
    if (!text.trim()) {
      setTranslatedText("");
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateWithGemini(
        text,
        selectedSourceLang,
        selectedTargetLang
      );
      setTranslatedText(result);
      setError(null);
    } catch (err) {
      setError("Translation failed: " + err.message);
      console.error("Translation error:", err);
    } finally {
      setIsTranslating(false);
    }
  }, 1000);

  // Effect to trigger translation when text or languages change
  useEffect(() => {
    if (autoTranslate && text.trim()) {
      debouncedTranslate(text);
    }
    return () => {
      debouncedTranslate.cancel();
    };
  }, [text, selectedSourceLang, selectedTargetLang, autoTranslate]);

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const handleTranslate = () => {
    debouncedTranslate.cancel();
    debouncedTranslate(text);
  };

  const clearText = () => {
    setText("");
    setTranslatedText("");
  };

  const swapLanguages = () => {
    if (selectedSourceLang === "Language detection") return;

    setSelectedSourceLang(selectedTargetLang);
    setSelectedTargetLang(selectedSourceLang);

    if (translatedText) {
      setText(translatedText);
      setTranslatedText(text);
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowAuthForm(false);
    setActiveTab("text"); // Quay lại tab text sau khi đăng nhập
  };

  const handleOpenAuth = () => {
    setShowAuthForm(true);
  };

  const handleCloseAuth = () => {
    setShowAuthForm(false);
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
          {isLoggedIn ? (
            <div className="profile-circle">
              <img
                src="https://i.pravatar.cc/100"
                alt="User"
                className="avatar-img"
              />
            </div>
          ) : (
            <button className="login-button" onClick={handleOpenAuth}>
              <i className="bx bxs-user-circle"></i>
              <span>Login</span>
            </button>
          )}
        </div>
      </header>

      {!showAuthForm && (
        <>
          <TranslationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          <main className="translation-section">
            {activeTab === "text" && (
              <>
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
                  handleTextChange={handleTextChange}
                  charCount={text.length}
                  clearText={clearText}
                  handleTranslate={handleTranslate}
                  isTranslating={isTranslating}
                  error={error}
                  autoTranslate={autoTranslate}
                  selectedSourceLang={selectedSourceLang}
                  selectedTargetLang={selectedTargetLang}
                />
              </>
            )}
            {activeTab === "document" && <DocumentTranslation />}
            {activeTab === "image" && <ImageTranslation />}
          </main>
        </>
      )}

      {showAuthForm && (
        <AuthForm onLoginSuccess={handleLogin} onClose={handleCloseAuth} />
      )}
    </div>
  );
}

export default App;
