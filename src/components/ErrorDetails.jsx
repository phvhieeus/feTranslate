// src/components/ErrorDetails.jsx
import React from 'react';

export function ErrorDetails({ errors, onClose, onFixAllErrors, onFixSingleError }) {
  if (!errors || errors.length === 0) {
    return (
      <div className="error-details-modal">
        <div className="error-details-content">
          <div className="error-details-header">
            <h3>Kiểm tra lỗi</h3>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          <div className="error-details-body">
            <p>Không tìm thấy lỗi nào trong văn bản của bạn.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="error-details-modal">
      <div className="error-details-content">
        <div className="error-details-header">
          <h3>Danh sách lỗi ({errors.length})</h3>
          <div className="error-actions">
            {errors.length > 0 && (
              <button 
                className="fix-all-button" 
                onClick={onFixAllErrors}
              >
                Sửa tất cả lỗi
              </button>
            )}
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="error-details-body">
          <ul className="error-list">
            {errors.map((error, index) => (
              <li key={index} className="error-item">
                <div className="error-header">
                  <span className="error-word">"{error.word}"</span>
                  <span className="error-arrow">→</span>
                  <span className="error-suggestion">"{error.suggestion}"</span>
                  <button 
                    className="fix-error-button"
                    onClick={() => onFixSingleError(error)}
                  >
                    Sửa lỗi này
                  </button>
                </div>
                
                {error.context && (
                  <div className="error-context">
                    <span className="context-label">Bối cảnh:</span> {error.context}
                  </div>
                )}
                
                {error.explanation && (
                  <div className="error-explanation">
                    <span className="explanation-label">Giải thích:</span> {error.explanation}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
