// src/components/ErrorDetails.jsx
import React from 'react';

export function ErrorDetails({ errors, onClose, onFixAllErrors, onFixSingleError }) {
  if (!errors || errors.length === 0) {
    return (
      <div className="error-details-modal">
        <div className="error-details-content">
          <div className="error-details-header">
            <h3>Check for errors.</h3>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          <div className="error-details-body">
            <p>No errors found in your text.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="error-details-modal">
      <div className="error-details-content">
        <div className="error-details-header">
          <h3>Error list ({errors.length})</h3>
          <div className="error-actions">
            {errors.length > 0 && (
              <button 
                className="fix-all-button" 
                onClick={onFixAllErrors}
              >
                Fix all errors.
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
                    Fix this error
                  </button>
                </div>
                
                {error.context && (
                  <div className="error-context">
                    <span className="context-label">Context:</span> {error.context}
                  </div>
                )}
                
                {error.explanation && (
                  <div className="error-explanation">
                    <span className="explanation-label">Explanation:</span> {error.explanation}
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
