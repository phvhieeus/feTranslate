// src/components/LoginPrompt.jsx
import React from "react";
import "../App.css"; // Import CSS từ App.css

export const LoginPrompt = ({ onClose, onLogin }) => {
  return (
    <div className="login-prompt-overlay">
      <div className="login-prompt-container">
        <div className="login-prompt-header">
          <h3>Đăng nhập để tiếp tục</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="login-prompt-content">
          <div className="lock-icon">🔒</div>
          <p>Chức năng này yêu cầu đăng nhập để sử dụng.</p>
          <p>Vui lòng đăng nhập để tiếp tục.</p>
        </div>
        <div className="login-prompt-buttons">
          <button className="cancel-button" onClick={onClose}>
            Hủy bỏ
          </button>
          <button className="login-button" onClick={onLogin}>
            Đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};
