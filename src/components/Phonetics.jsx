import React from 'react';

export function Phonetics({ phonetics }) {
  if (!phonetics || phonetics.length === 0) return null;
  
  return (
    <div className="phonetics-container">
      {phonetics.map((item, index) => (
        <div key={index} className="phonetic-item">
          <span className="phonetic-word">{item.word}</span>
          <span className="phonetic-ipa">{item.ipa}</span>
        </div>
      ))}
    </div>
  );
}
