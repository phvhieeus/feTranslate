import React, { useState } from "react";
import { LoginPrompt } from "./LoginPrompt";

export const TranslationTabs = ({
  activeTab,
  setActiveTab,
  isLoggedIn,
  onLoginClick, // Đảm bảo prop này được nhận
}) => {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [attemptedTab, setAttemptedTab] = useState(null);

  const handleTabClick = (tab) => {
    // Tab "text" luôn có thể truy cập
    // Các tab khác yêu cầu đăng nhập
    if (tab === "text" || isLoggedIn) {
      setActiveTab(tab);
    } else {
      // Lưu tab người dùng muốn truy cập
      setAttemptedTab(tab);
      setShowLoginPrompt(true);
    }
  };

  // Không cần hàm handleLoginSuccess ở đây nữa vì logic chuyển tab đã nằm trong App.jsx

  return (
    <>
      <div className="tabs">
        <button
          className={`tab ${activeTab === "text" ? "active" : ""}`}
          onClick={() => handleTabClick("text")}
        >
          <span className="tab-icon">📝</span>
          Text
        </button>
        {/* Thêm Tab Thành ngữ mới */}
        <button
          className={`tab ${activeTab === "idiom" ? "active" : ""}`}
          onClick={() => handleTabClick("idiom")}
        >
          <span className="tab-icon">💡</span>
          Thành ngữ
          {!isLoggedIn && <span className="lock-icon">🔒</span>}
        </button>
        <button
          className={`tab ${activeTab === "image" ? "active" : ""}`}
          onClick={() => handleTabClick("image")}
        >
          <span className="tab-icon">🖼️</span>
          Image
          {!isLoggedIn && <span className="lock-icon">🔒</span>}
        </button>
        <button
          className={`tab ${activeTab === "document" ? "active" : ""}`}
          onClick={() => handleTabClick("document")}
        >
          <span className="tab-icon">📄</span>
          Document
          {!isLoggedIn && <span className="lock-icon">🔒</span>}
        </button>
      </div>

      {showLoginPrompt && (
        <LoginPrompt
          onClose={() => setShowLoginPrompt(false)}
          onLogin={() => {
            setShowLoginPrompt(false);
            onLoginClick(); // Gọi hàm được truyền từ App.jsx để mở form đăng nhập/đăng ký
          }}
        />
      )}
    </>
  );
};
