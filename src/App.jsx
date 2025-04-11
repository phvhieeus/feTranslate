import React, { useState, useEffect } from "react";
import { TranslationTabs } from "./components/TranslationTabs";
import { LanguageControls } from "./components/LanguageControls";
import { TranslationPanel } from "./components/TranslationPanel";
import { ImageTranslation } from "./components/ImageTranslate"; // Đảm bảo tên file đúng
import { DocumentTranslation } from "./components/DocumentTranslation";
import { IdiomTranslation } from "./components/IdiomTranslation"; // Import component mới
import { translateWithGemini } from "./services/openaiTranslation";
import { checkGrammarWithGemini } from "./services/grammarChecker";
import { ErrorDetails } from "./components/ErrorDetails";
import AuthForm from "./components/AuthForm";
import { LoginPrompt } from "./components/LoginPrompt";
import { TranslationHistory } from "./components/TranslationHistory";
import { RecentTranslations } from "./components/RecentTranslations";
import { saveTranslation } from "./services/translationHistory";
import UserProfileForm from "./components/UserProfileForm";
import debounce from "lodash.debounce";
import axios from "axios";
import "./App.css"; // Import CSS

// Đặt URL cơ sở cho tất cả các API requests
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
  const [showProfileForm, setShowProfileForm] = useState(false);

  // Thêm hàm xử lý cập nhật profile
  const handleUpdateProfile = (updatedUser) => {
    setUser(updatedUser);
    // Cập nhật localStorage nếu cần
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

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

  // State cho lịch sử dịch
  const [showHistory, setShowHistory] = useState(false);
  const [recentTranslation, setRecentTranslation] = useState(null);
  const [savedTranslation, setSavedTranslation] = useState(null); // Thêm state này nếu chưa có

  // Kiểm tra đăng nhập khi ứng dụng khởi động
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    if (storedUser && token) { // Kiểm tra cả token
      try {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
      }
    } else {
        // Nếu thiếu user hoặc token, đảm bảo đã đăng xuất
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        setIsLoggedIn(false);
        setUser(null);
    }
  }, []);

  // Hàm lưu lịch sử dịch
  const saveTranslationToHistory = () => {
    if (activeTab === 'text' && text && translatedText) { // Chỉ lưu lịch sử cho tab text
      const saved = saveTranslation(
        text,
        translatedText,
        selectedSourceLang,
        selectedTargetLang
      );
      if (saved) {
        setRecentTranslation(saved);
        // Có thể thêm logic cập nhật savedTranslation nếu cần
      }
    }
  };

  // Cải tiến các hàm sửa lỗi để xử lý dấu câu tốt hơn
  const fixAllErrors = () => {
    if (!grammarErrors.errors || grammarErrors.errors.length === 0) return;

    let newText = text;

    // Sắp xếp lỗi theo vị trí bắt đầu giảm dần để tránh vấn đề khi thay thế text
    const sortedErrors = [...grammarErrors.errors].sort((a, b) => {
      // Cần tìm vị trí thực tế của từ trong văn bản hiện tại
      // Lưu ý: indexOf có thể không đủ tin cậy nếu từ xuất hiện nhiều lần
      // Cần một cơ chế định vị lỗi chính xác hơn nếu có thể (ví dụ: dựa vào index)
      // Tạm thời dùng indexOf để minh họa
      const posA = newText.indexOf(a.word);
      const posB = newText.indexOf(b.word);
      // Xử lý trường hợp không tìm thấy từ (nên không xảy ra nếu logic đúng)
      if (posA === -1 || posB === -1) return 0;
      return posB - posA;
    });

    // Sửa từng lỗi một, từ phải sang trái trong văn bản
    sortedErrors.forEach((error) => {
      // Cần logic thay thế chính xác hơn, đặc biệt nếu từ lặp lại
      // Ví dụ: thay thế tại vị trí cụ thể thay vì dùng replace toàn bộ
      // Tạm thời dùng replace để minh họa
      if (error.word === "[PUNCT]") {
        // Xử lý đặc biệt cho lỗi dấu câu (logic này cần xem xét kỹ)
        if (error.position === "end") {
          newText = newText.trimEnd() + error.suggestion;
        } else if (error.context) {
          // Logic xử lý context cần rất cẩn thận
          const contextWithoutPunct = error.context.replace(/\\[PUNCT\\]/g, "").trim();
          if (contextWithoutPunct && newText.includes(contextWithoutPunct)) {
            const punctPos = newText.indexOf(contextWithoutPunct) + contextWithoutPunct.length;
            if (punctPos <= newText.length && newText[punctPos] !== error.suggestion) {
              newText = newText.substring(0, punctPos) + error.suggestion + newText.substring(punctPos);
            }
          }
        }
      } else {
        // Xử lý lỗi từ thông thường - Cần cẩn thận với replace toàn cục
        // Xem xét việc chỉ thay thế lần xuất hiện đầu tiên hoặc tại vị trí cụ thể
        try {
            // Thoát các ký tự đặc biệt trong regex
            const escapedWord = error.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Tạo regex để chỉ khớp với từ hoàn chỉnh (word boundary)
            const regex = new RegExp(`\\b${escapedWord}\\b`, 'g');
            // Chỉ thay thế lần xuất hiện đầu tiên hoặc theo logic khác nếu cần
            // newText = newText.replace(regex, error.suggestion); // Thay thế tất cả
             let replaced = false;
             newText = newText.replace(regex, (match) => {
                 if (!replaced) {
                     replaced = true;
                     return error.suggestion;
                 }
                 return match; // Giữ nguyên các lần xuất hiện sau
             });
        } catch (e) {
            console.error("Regex error during fixAllErrors:", e);
            // Fallback hoặc bỏ qua lỗi này
        }
      }
    });

    setText(newText);

    // Reset trạng thái lỗi và kích hoạt kiểm tra lại sau khi sửa
    setGrammarErrors({
      errorCount: 0,
      errors: [],
      checked: true, // Đánh dấu đã kiểm tra (dù có thể cần kiểm tra lại)
      timestamp: Date.now(),
    });

    setShowErrorDetails(false);

    // Kích hoạt kiểm tra lỗi lại sau khi sửa với một chút delay
    // Cần đảm bảo debouncedGrammarCheck tồn tại và được định nghĩa đúng
    if (debouncedGrammarCheck && typeof debouncedGrammarCheck.cancel === 'function') {
        setTimeout(() => {
          debouncedGrammarCheck.cancel();
          debouncedGrammarCheck(newText);
        }, 500);
    }
  };

  const fixSingleError = (error) => {
    if (!error || !error.id) return;

    let newText = text;

    // Logic thay thế tương tự fixAllErrors nhưng chỉ cho một lỗi
    // Cần xác định vị trí chính xác của lỗi để thay thế
    if (error.word === "[PUNCT]") {
       // Logic xử lý dấu câu (cần xem xét kỹ)
       if (error.position === "end") {
         newText = newText.trimEnd() + error.suggestion;
       } else if (error.context) {
         const contextWithoutPunct = error.context.replace(/\\[PUNCT\\]/g, "").trim();
         if (contextWithoutPunct && newText.includes(contextWithoutPunct)) {
           const punctPos = newText.indexOf(contextWithoutPunct) + contextWithoutPunct.length;
           if (punctPos <= newText.length && newText[punctPos] !== error.suggestion) {
             newText = newText.substring(0, punctPos) + error.suggestion + newText.substring(punctPos);
           }
         }
       }
    } else {
        // Xử lý lỗi từ thông thường - Cần thay thế tại vị trí cụ thể nếu có thể
        try {
            const escapedWord = error.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Tìm vị trí lỗi (cần thông tin vị trí từ API hoặc logic khác)
            // Tạm thời thay thế lần xuất hiện đầu tiên
            const regex = new RegExp(`\\b${escapedWord}\\b`);
            newText = newText.replace(regex, error.suggestion);
        } catch (e) {
            console.error("Regex error during fixSingleError:", e);
            // Fallback hoặc bỏ qua
        }
    }


    setText(newText);

    // Lọc lỗi đã sửa ra khỏi danh sách
    const updatedErrors = grammarErrors.errors.filter((e) => e.id !== error.id);
    setGrammarErrors({
      errorCount: updatedErrors.length,
      errors: updatedErrors,
      checked: true,
      timestamp: Date.now(),
    });

    // Đóng modal nếu không còn lỗi nào
    if (updatedErrors.length === 0) {
      setShowErrorDetails(false);
    }

    // Kích hoạt kiểm tra lỗi lại sau khi sửa
    if (debouncedGrammarCheck && typeof debouncedGrammarCheck.cancel === 'function') {
        setTimeout(() => {
          debouncedGrammarCheck.cancel();
          debouncedGrammarCheck(newText);
        }, 500);
    }
  };


  // Debounce cho dịch thuật
  const debouncedTranslate = debounce(async (textToTranslate) => {
    if (!textToTranslate.trim()) {
      setTranslatedText("");
      setSourceTextWithStress("");
      setPartsOfSpeech([]);
      setPhonetics([]);
      return;
    }

    setIsTranslating(true);
    setError(null); // Xóa lỗi cũ trước khi dịch
    try {
      const result = await translateWithGemini(
        textToTranslate,
        selectedSourceLang,
        selectedTargetLang
      );

      if (typeof result === "object" && result.translation) {
        setTranslatedText(result.translation);
        setSourceTextWithStress(result.sourceTextWithStress || textToTranslate);
        setPartsOfSpeech(result.partsOfSpeech || []);
        setPhonetics(result.phonetics || []);
        console.log("Phonetics received:", result.phonetics);
      } else if (typeof result === 'string') { // Xử lý trường hợp API trả về string (dù không mong muốn)
        setTranslatedText(result);
        setSourceTextWithStress(textToTranslate);
        setPartsOfSpeech([]);
        setPhonetics([]);
      } else {
         // Trường hợp kết quả không hợp lệ
         throw new Error("Invalid translation result format");
      }
    } catch (err) {
      setError("Translation failed: " + err.message);
      console.error("Translation error:", err);
      // Không xóa bản dịch cũ khi có lỗi để người dùng vẫn thấy kết quả trước đó
      // setTranslatedText("");
    } finally {
      setIsTranslating(false);
    }
  }, 1000);

  // Debounce cho kiểm tra lỗi
  const debouncedGrammarCheck = debounce(async (textToCheck) => {
    if (!textToCheck.trim()) {
      setGrammarErrors({ errorCount: 0, errors: [], checked: false, timestamp: Date.now() });
      return;
    }

    try {
      const result = await checkGrammarWithGemini(textToCheck, selectedSourceLang);
      setGrammarErrors(result);
    } catch (err) {
      console.error("Grammar check error:", err);
      // Giữ lại lỗi cũ hoặc reset tùy logic
      setGrammarErrors({ errorCount: 0, errors: [], checked: false, timestamp: Date.now(), message: `Check failed: ${err.message}` });
    }
  }, 800);

  // Effect cho dịch thuật và kiểm tra lỗi (chỉ áp dụng cho tab text)
  useEffect(() => {
    if (activeTab === 'text') {
        if (autoTranslate && text.trim()) {
          debouncedTranslate(text);
        } else if (!text.trim()) {
          // Clear kết quả dịch và thông tin liên quan khi input rỗng
          setTranslatedText("");
          setSourceTextWithStress("");
          setPartsOfSpeech([]);
          setPhonetics([]);
          debouncedTranslate.cancel(); // Hủy debounce nếu input rỗng
        }

        // Kiểm tra lỗi ngữ pháp
        if (text.trim()) {
          debouncedGrammarCheck(text);
        } else {
          // Clear lỗi ngữ pháp khi input rỗng
          setGrammarErrors({ errorCount: 0, errors: [], checked: false, timestamp: Date.now() });
          debouncedGrammarCheck.cancel(); // Hủy debounce nếu input rỗng
        }
    } else {
        // Nếu không phải tab text, hủy các debounce đang chờ
        debouncedTranslate.cancel();
        debouncedGrammarCheck.cancel();
    }

    // Cleanup function để hủy debounce khi component unmount hoặc dependencies thay đổi
    return () => {
      debouncedTranslate.cancel();
      debouncedGrammarCheck.cancel();
    };
  }, [text, selectedSourceLang, selectedTargetLang, autoTranslate, activeTab]); // Thêm activeTab vào dependencies

  // Effect để lưu lịch sử dịch khi có bản dịch mới (chỉ cho tab text)
  useEffect(() => {
    if (activeTab === 'text' && translatedText && text) {
      saveTranslationToHistory();
    }
  }, [translatedText, text, activeTab]); // Thêm activeTab

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);

    // Reset các state liên quan nếu text rỗng (chỉ khi ở tab text)
    // Việc reset này cũng được xử lý trong useEffect, nhưng để đây để phản hồi nhanh hơn
    if (activeTab === 'text' && !newText.trim()) {
      setTranslatedText("");
      setSourceTextWithStress("");
      setPartsOfSpeech([]);
      setPhonetics([]);
      setGrammarErrors({ errorCount: 0, errors: [], checked: false, timestamp: Date.now() });
    }
  };

  // Trigger dịch thủ công (chỉ cho tab text)
  const handleTranslate = () => {
    if (activeTab === 'text') {
        debouncedTranslate.cancel(); // Hủy debounce cũ (nếu có)
        debouncedTranslate(text); // Kích hoạt dịch ngay
    }
  };

  // Xóa text (chỉ cho tab text)
  const clearText = () => {
     if (activeTab === 'text') {
        setText("");
        setTranslatedText("");
        setSourceTextWithStress("");
        setPartsOfSpeech([]);
        setPhonetics([]);
        setGrammarErrors({ errorCount: 0, errors: [], checked: false, timestamp: Date.now() });
        // Hủy các debounce đang chờ
        debouncedTranslate.cancel();
        debouncedGrammarCheck.cancel();
     }
  };

  // Đổi ngôn ngữ
  const swapLanguages = () => {
    if (selectedSourceLang === "Language detection") return;

    const currentSource = selectedSourceLang;
    const currentTarget = selectedTargetLang;

    setSelectedSourceLang(currentTarget);
    setSelectedTargetLang(currentSource);

    // Nếu đang ở tab text và có text, đổi chỗ text và dịch lại nếu cần
    if (activeTab === 'text' && translatedText) {
      const oldText = text;
      setText(translatedText); // Đặt text mới là bản dịch cũ
      setTranslatedText(oldText); // Đặt bản dịch mới là text cũ (tạm thời)

      // Reset các thông tin phụ thuộc ngôn ngữ nguồn cũ
      setSourceTextWithStress("");
      setPartsOfSpeech([]);
      setPhonetics([]);
      setGrammarErrors({ errorCount: 0, errors: [], checked: false, timestamp: Date.now() });

      // Nếu autoTranslate bật, kích hoạt dịch lại với ngôn ngữ mới và text mới
      if (autoTranslate && translatedText.trim()) { // Dùng translatedText (là text mới)
          debouncedTranslate.cancel();
          debouncedTranslate(translatedText);
      }
       // Kích hoạt kiểm tra lỗi cho text mới
       if (translatedText.trim()) {
           debouncedGrammarCheck.cancel();
           debouncedGrammarCheck(translatedText);
       }
    }
    // Logic tương tự có thể áp dụng cho tab Idiom nếu cần
    // Ví dụ: đổi inputText và result.equivalentPhrase
  };

  // --- Xử lý Authentication và Tab Locking ---

  const handleLogin = (userData, token) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("accessToken", token);
    setUser(userData);
    setIsLoggedIn(true);
    setShowAuthForm(false); // Đóng form đăng nhập/đăng ký

    // Nếu có tab đang chờ truy cập, chuyển đến tab đó
    if (attemptedTab) {
      setActiveTab(attemptedTab);
      setAttemptedTab(null); // Reset tab chờ
    }
    setShowLoginPrompt(false); // Đóng cả prompt nếu đang mở
  };

  const handleOpenAuth = () => {
    setShowAuthForm(true);
    setShowLoginPrompt(false); // Đóng prompt khi mở form chính
  };

  const handleCloseAuth = () => {
    setShowAuthForm(false);
    // Không reset attemptedTab ở đây, để có thể quay lại tab đó nếu đăng nhập thành công
  };

  // Hàm đóng LoginPrompt
  const handleCloseLoginPrompt = () => {
    setShowLoginPrompt(false);
    setAttemptedTab(null); // Reset tab đã thử truy cập khi đóng prompt
  };

  // Hàm mở form đăng nhập từ LoginPrompt
  const handleLoginFromPrompt = () => {
    setShowLoginPrompt(false); // Đóng prompt
    setShowAuthForm(true); // Mở form đăng nhập/đăng ký chính
    // attemptedTab vẫn được giữ lại
  };

  // Thêm hàm đăng xuất
  const handleLogout = () => {
    axios.post("/auth/logout")
      .then(() => {
        console.log("Logout successful via API");
      })
      .catch((error) => {
        console.error("Logout API failed (ignoring):", error);
      })
      .finally(() => {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        setUser(null);
        setIsLoggedIn(false);
        setShowUserMenu(false);

        // Chuyển về tab text nếu đang ở tab yêu cầu đăng nhập
        if (["idiom", "document", "image"].includes(activeTab)) {
          setActiveTab("text");
        }
        // Reset các state liên quan đến auth
        setAttemptedTab(null);
        setShowLoginPrompt(false);
        setShowAuthForm(false);
      });
  };


  return (
    <div className={`App ${showHistory ? 'sidebar-open' : ''}`}>
      <header className="App-header">
         <div className="header-left">
           <button className="menu-button">☰</button>
           <div className="logo">
             <span className="google-logo">Villa</span> {/* Đã đổi tên */}
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
                   src={user?.avatarUrl || "https://i.pravatar.cc/100"} // Sử dụng avatar nếu có
                   alt="User"
                   className="avatar-img"
                 />
               </div>
               {showUserMenu && (
                 <div className="user-dropdown">
                   <div className="user-info">
                     <p className="user-name">{user?.name || 'User'}</p>
                     <p className="user-email">{user?.email}</p>
                   </div>
                   <div className="dropdown-divider"></div>
                   <button
                     className="dropdown-item"
                     onClick={() => { setShowProfileForm(true); setShowUserMenu(false); }}
                   >
                     Update Profile
                   </button>
                   <button className="dropdown-item" onClick={handleLogout}>
                     Log out
                   </button>
                 </div>
               )}
             </div>
           ) : (
             <button className="simple-login-button" onClick={handleOpenAuth}>
               Log in
             </button>
           )}
         </div>
      </header>

      {/* Form cập nhật Profile */}
      {showProfileForm && (
        <UserProfileForm
          user={user}
          onClose={() => setShowProfileForm(false)}
          onUpdateSuccess={handleUpdateProfile}
        />
      )}

      {/* Nội dung chính (Tabs, Panels) - Chỉ hiển thị khi không có AuthForm */}
      {!showAuthForm && (
        <>
          <TranslationTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isLoggedIn={isLoggedIn}
            onLoginClick={handleOpenAuth} // Truyền hàm để mở AuthForm khi click tab bị khóa
          />

          <main className="translation-section">
            {/* Tab Text */}
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
                  handleTranslate={handleTranslate} // Nút dịch thủ công
                  isTranslating={isTranslating}
                  error={error}
                  autoTranslate={autoTranslate} // Truyền state này
                  selectedSourceLang={selectedSourceLang}
                  selectedTargetLang={selectedTargetLang}
                  grammarErrors={grammarErrors}
                  toggleErrorDetails={() => setShowErrorDetails(!showErrorDetails)}
                />
                <RecentTranslations
                  recentTranslation={recentTranslation}
                  savedTranslation={savedTranslation}
                  onViewHistory={() => setShowHistory(true)}
                />
              </>
            )}

            {/* Tab Thành ngữ */}
            {activeTab === "idiom" && isLoggedIn && (
              <IdiomTranslation
                selectedSourceLang={selectedSourceLang}
                selectedTargetLang={selectedTargetLang}
                setSelectedSourceLang={setSelectedSourceLang}
                setSelectedTargetLang={setSelectedTargetLang}
                swapLanguages={swapLanguages}
              />
            )}

            {/* Tab Document */}
            {activeTab === "document" && isLoggedIn && <DocumentTranslation />}

            {/* Tab Image */}
            {activeTab === "image" && isLoggedIn && <ImageTranslation />}

            {/* --- Hợp nhất thông báo yêu cầu đăng nhập --- */}
            {["idiom", "document", "image"].includes(activeTab) && !isLoggedIn && (
                <div className="locked-feature-message">
                  <div className="lock-icon">🔒</div>
                  <h3>Tính năng này yêu cầu đăng nhập.</h3>
                  <p>
                    Vui lòng đăng nhập để sử dụng tính năng dịch{" "}
                    {activeTab === "idiom" ? "thành ngữ" :
                     activeTab === "document" ? "tài liệu" : "hình ảnh"}.
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
      {showErrorDetails && grammarErrors.errors.length > 0 && ( // Chỉ hiển thị khi có lỗi
        <ErrorDetails
          errors={grammarErrors.errors}
          onClose={() => setShowErrorDetails(false)}
          onFixAllErrors={fixAllErrors}
          onFixSingleError={fixSingleError}
        />
      )}

      {/* Form Đăng nhập/Đăng ký */}
      {showAuthForm && (
        <AuthForm
           onLoginSuccess={handleLogin}
           onClose={handleCloseAuth}
        />
      )}

      {/* Prompt yêu cầu đăng nhập (khi click tab bị khóa) */}
      {showLoginPrompt && (
        <LoginPrompt
          onClose={handleCloseLoginPrompt}
          onLogin={handleLoginFromPrompt} // Mở AuthForm từ prompt
        />
      )}

      {/* Sidebar Lịch sử dịch */}
      <TranslationHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}

export default App;
