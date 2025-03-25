// src/components/LoginPrompt.jsx
import React from "react";
import "../App.css"; // Import CSS từ App.css

export const LoginPrompt = ({ onClose, onLogin }) => {
  return (
    <div className="login-prompt-overlay">
      <div className="login-prompt-container">
        <div className="login-prompt-header">
          <h3>Sign in to continue</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="login-prompt-content">
          <div className="lock-icon">🔒</div>
          <p>This feature requires login to use</p>
          <p>Please login to continue</p>
        </div>
        <div className="login-prompt-buttons">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="login-button" onClick={onLogin}>
            Log in
          </button>
        </div>
      </div>
    </div>
  );
};
