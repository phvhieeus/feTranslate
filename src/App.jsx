import React, { useState, useEffect } from "react";
import { TranslationTabs } from "./components/TranslationTabs";
import { LanguageControls } from "./components/LanguageControls";
import { TranslationPanel } from "./components/TranslationPanel";
import { ImageTranslation } from "./components/ImageTranslate";
import { DocumentTranslation } from "./components/DocumentTranslation";
import { translateWithGemini } from "./services/openaiTranslation";
import { checkGrammarWithGemini } from "./services/grammarChecker";
import { ErrorDetails } from "./components/ErrorDetails";
import AuthForm from "./components/AuthForm";
import { LoginPrompt } from "./components/LoginPrompt";
import debounce from "lodash.debounce";
import axios from "axios";
import "./App.css"; // Import CSS

// Đặt URL cơ sở cho tất cả các API requests
// Thay đổi URL này theo URL backend của bạn
axios.defaults.baseURL = "http://localhost:8080";

// Thêm interceptor để đính kèm token xác thực với mỗi request
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [attemptedTab, setAttemptedTab] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Thêm state cho kiểm tra lỗi
  const [grammarErrors, setGrammarErrors] = useState({
    errorCount: 0,
    errors: [],
    checked: false,
    timestamp: Date.now(),
  });
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [sourceTextWithStress, setSourceTextWithStress] = useState("");
  const [partsOfSpeech, setPartsOfSpeech] = useState([]);
  // State cho phonetics
  const [phonetics, setPhonetics] = useState([]);

  // Kiểm tra đăng nhập khi ứng dụng khởi động
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
      }
    }
  }, []);

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
    sortedErrors.forEach((error) => {
      if (error.word === "[PUNCT]") {
        // Xử lý đặc biệt cho lỗi dấu câu
        if (error.position === "end") {
          // Nếu thiếu dấu câu ở cuối câu
          newText = newText.trimEnd() + error.suggestion;
        } else if (error.context) {
          // Xử lý thiếu dấu câu ở các vị trí khác dựa vào context
          const contextWithoutPunct = error.context
            .replace(/\[PUNCT\]/g, "")
            .trim();
          if (contextWithoutPunct && newText.includes(contextWithoutPunct)) {
            const punctPos =
              newText.indexOf(contextWithoutPunct) + contextWithoutPunct.length;
            // Kiểm tra xem đã có dấu câu ở vị trí này chưa
            if (
              punctPos <= newText.length &&
              newText[punctPos] !== error.suggestion
            ) {
              newText =
                newText.substring(0, punctPos) +
                error.suggestion +
                newText.substring(punctPos);
            }
          }
        }
      } else {
        // Xử lý lỗi từ thông thường
        const escapedWord = error.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Sử dụng regex chính xác hơn cho từ
        const regex = new RegExp(escapedWord, "g");
        newText = newText.replace(regex, error.suggestion);
      }
    });

    setText(newText);

    // Reset trạng thái lỗi và kích hoạt kiểm tra lại sau khi sửa
    setGrammarErrors({
      errorCount: 0,
      errors: [],
      checked: true,
      timestamp: Date.now(), // Thêm timestamp giúp React nhận biết thay đổi
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
        const contextWithoutPunct = error.context
          .replace(/\[PUNCT\]/g, "")
          .trim();
        if (contextWithoutPunct && newText.includes(contextWithoutPunct)) {
          const punctPos =
            newText.indexOf(contextWithoutPunct) + contextWithoutPunct.length;
          // Kiểm tra xem đã có dấu câu ở vị trí này chưa
          if (
            punctPos <= newText.length &&
            newText[punctPos] !== error.suggestion
          ) {
            newText =
              newText.substring(0, punctPos) +
              error.suggestion +
              newText.substring(punctPos);
          }
        }
      }
    } else {
      // Xử lý lỗi từ thông thường
      const escapedWord = error.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedWord, "g");
      newText = newText.replace(regex, error.suggestion);
    }

    setText(newText);

    // Lọc lỗi đã sửa ra khỏi danh sách
    const updatedErrors = grammarErrors.errors.filter((e) => e.id !== error.id);
    setGrammarErrors({
      errorCount: updatedErrors.length,
      errors: updatedErrors,
      checked: true,
      timestamp: Date.now(), // Thêm timestamp
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

      if (typeof result === "object" && result.translation) {
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
      setGrammarErrors({
        errorCount: 0,
        errors: [],
        checked: false,
        timestamp: Date.now(),
      });
      return;
    }

    try {
      const result = await checkGrammarWithGemini(text, selectedSourceLang);
      setGrammarErrors(result);
    } catch (err) {
      console.error("Grammar check error:", err);
      setGrammarErrors({
        errorCount: 0,
        errors: [],
        checked: false,
        timestamp: Date.now(),
      });
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
      setGrammarErrors({
        errorCount: 0,
        errors: [],
        checked: false,
        timestamp: Date.now(),
      });
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
      setGrammarErrors({
        errorCount: 0,
        errors: [],
        checked: false,
        timestamp: Date.now(),
      });
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
    setGrammarErrors({
      errorCount: 0,
      errors: [],
      checked: false,
      timestamp: Date.now(),
    });
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

  // Thêm các hàm xử lý đăng nhập
  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setShowAuthForm(false);

    // Kiểm tra nếu có tab đã được người dùng cố gắng truy cập trước khi đăng nhập
    if (attemptedTab) {
      setActiveTab(attemptedTab);
      setAttemptedTab(null);
    }
  };

  const handleOpenAuth = () => {
    setShowAuthForm(true);
  };

  const handleCloseAuth = () => {
    setShowAuthForm(false);
  };

  // Hàm xử lý khi người dùng nhấp vào một tab bị khóa
  const handleLockedTabClick = (tab) => {
    setAttemptedTab(tab);
    setShowLoginPrompt(true);
  };

  // Hàm đóng LoginPrompt
  const handleCloseLoginPrompt = () => {
    setShowLoginPrompt(false);
  };

  // Hàm mở form đăng nhập từ LoginPrompt
  const handleLoginFromPrompt = () => {
    setShowLoginPrompt(false);
    setShowAuthForm(true);
  };

  // Thêm hàm đăng xuất
  const handleLogout = () => {
    axios
      .post("/auth/logout")
      .then(() => {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        setUser(null);
        setIsLoggedIn(false);
        setShowUserMenu(false);

        // Nếu đang ở tab cần đăng nhập, chuyển về tab text
        if (activeTab !== "text") {
          setActiveTab("text");
        }
      })
      .catch((error) => {
        console.error("Logout failed:", error);
        // Xóa dữ liệu local ngay cả khi API gặp lỗi
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        setUser(null);
        setIsLoggedIn(false);
        if (activeTab !== "text") {
          setActiveTab("text");
        }
      });
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
          {isLoggedIn ? (
            <div className="user-menu">
              <div
                className="profile-circle"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <img
                  src="https://i.pravatar.cc/100"
                  alt="User"
                  className="avatar-img"
                />
              </div>
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <p className="user-name">{user?.name}</p>
                    <p className="user-email">{user?.email}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={handleLogout}>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="simple-login-button" onClick={handleOpenAuth}>
              Đăng nhập
            </button>
          )}
        </div>
      </header>

      {!showAuthForm && (
        <>
          <TranslationTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isLoggedIn={isLoggedIn}
            onLoginClick={handleOpenAuth}
          />

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
                    <span className="toggle-text">Auto-translate</span>
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
                  phonetics={phonetics}
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
                  toggleErrorDetails={() =>
                    setShowErrorDetails(!showErrorDetails)
                  }
                />
              </>
            )}
            {activeTab === "document" && isLoggedIn && <DocumentTranslation />}
            {activeTab === "image" && isLoggedIn && <ImageTranslation />}
            {(activeTab === "document" || activeTab === "image") &&
              !isLoggedIn && (
                <div className="locked-feature-message">
                  <div className="lock-icon">🔒</div>
                  <h3>Tính năng này yêu cầu đăng nhập</h3>
                  <p>
                    Vui lòng đăng nhập để sử dụng tính năng dịch{" "}
                    {activeTab === "document" ? "tài liệu" : "hình ảnh"}.
                  </p>
                  <button className="login-button" onClick={handleOpenAuth}>
                    Đăng nhập ngay
                  </button>
                </div>
              )}
          </main>
        </>
      )}

      {/* Modal chi tiết lỗi */}
      {showErrorDetails && (
        <ErrorDetails
          errors={grammarErrors.errors}
          onClose={() => setShowErrorDetails(false)}
          onFixAllErrors={fixAllErrors}
          onFixSingleError={fixSingleError}
        />
      )}

      {/* Thêm phần AuthForm */}
      {showAuthForm && (
        <AuthForm onLoginSuccess={handleLogin} onClose={handleCloseAuth} />
      )}

      {/* Thêm phần LoginPrompt */}
      {showLoginPrompt && (
        <LoginPrompt
          onClose={handleCloseLoginPrompt}
          onLogin={handleLoginFromPrompt}
        />
      )}
    </div>
  );
}

export default App;
