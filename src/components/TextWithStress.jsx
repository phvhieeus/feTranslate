// src/components/TextWithStress.jsx
import React from 'react';

export function TextWithStress({ text, phonetics = [] }) {
  if (!text) return null;
  
  // Tách văn bản thành các từ
  const words = text.split(' ').filter(word => word.trim() !== '');
  
  // Kiểm tra xem có phải chỉ có 1 từ không
  const isSingleWord = words.length === 1;
  
  // Nếu không phải 1 từ duy nhất, không hiển thị gì cả
  if (!isSingleWord) return null;
  
  // Tạo map từ phonetics để dễ truy cập
  const phoneticsMap = phonetics.reduce((map, item) => {
    map[item.word.toLowerCase()] = item.ipa;
    return map;
  }, {});
  
  // Xử lý từ duy nhất
  const word = words[0];
  
  // Kiểm tra xem từ có chứa dấu nhấn không
  const hasAccent = /[áéíóúÁÉÍÓÚ]/.test(word);
  
  // Lấy phiên âm IPA cho từ này (nếu có)
  const cleanWord = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const ipa = phoneticsMap[cleanWord] || phoneticsMap[word.toLowerCase()];
  
  // Xử lý từng ký tự trong từ
  const chars = word.split('').map((char, charIndex) => {
    const isAccentChar = /[áéíóúÁÉÍÓÚ]/.test(char);
    return (
      <span 
        key={charIndex} 
        className={isAccentChar ? "stressed" : ""}
      >
        {char}
      </span>
    );
  });
  
  return (
    <div className="text-with-stress">
      <span className="word-container">
        <span className="word">
          {chars}
        </span>
        {ipa && <span className="word-phonetic">{ipa}</span>}
      </span>
    </div>
  );
}
