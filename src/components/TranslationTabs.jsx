// src/components/TranslationTabs.jsx
import React, { useState } from "react";
import { LoginPrompt } from "./LoginPrompt";

export const TranslationTabs = ({
  activeTab,
  setActiveTab,
  isLoggedIn,
  onLoginClick,
}) => {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [attemptedTab, setAttemptedTab] = useState(null);

  const handleTabClick = (tab) => {
    if (tab === "text" || isLoggedIn) {
      setActiveTab(tab);
    } else {
      // Lưu tab người dùng muốn truy cập
      setAttemptedTab(tab);
      setShowLoginPrompt(true);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginPrompt(false);
    // Nếu đăng nhập thành công, chuyển đến tab người dùng muốn truy cập
    if (attemptedTab) {
      setActiveTab(attemptedTab);
      setAttemptedTab(null);
    }
  };

  return (
    <>
      <div className="tabs">
        <button
          className={`tab ${activeTab === "text" ? "active" : ""}`}
          onClick={() => handleTabClick("text")}
        >
          <span className="tab-icon">📝</span>
          Văn bản
        </button>
        <button
          className={`tab ${activeTab === "image" ? "active" : ""}`}
          onClick={() => handleTabClick("image")}
        >
          <span className="tab-icon">🖼️</span>
          Hình ảnh
          {!isLoggedIn && <span className="lock-icon">🔒</span>}
        </button>
        <button
          className={`tab ${activeTab === "document" ? "active" : ""}`}
          onClick={() => handleTabClick("document")}
        >
          <span className="tab-icon">📄</span>
          Tài liệu
          {!isLoggedIn && <span className="lock-icon">🔒</span>}
        </button>
      </div>

      {showLoginPrompt && (
        <LoginPrompt
          onClose={() => setShowLoginPrompt(false)}
          onLogin={() => {
            setShowLoginPrompt(false);
            onLoginClick();
          }}
        />
      )}
    </>
  );
};
