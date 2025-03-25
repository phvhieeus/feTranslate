import React from "react";

export function WordCategories({ translation, partsOfSpeech }) {
  // Group words by part of speech
  const groupedWords = partsOfSpeech.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item.word);
    return acc;
  }, {});

  // Map of part of speech to display name in Vietnamese
  const typeNames = {
    noun: "Danh từ",
    verb: "Động từ",
    adjective: "Tính từ",
    adverb: "Trạng từ",
    pronoun: "Đại từ",
    preposition: "Giới từ",
    conjunction: "Liên từ",
    interjection: "Thán từ",
    article: "Mạo từ",
    determiner: "Từ hạn định"
  };

  // Order of display (most common first)
  const displayOrder = [
    "noun", "verb", "adjective", "adverb", 
    "pronoun", "preposition", "conjunction", 
    "interjection", "article", "determiner"
  ];

  // Sort categories by the display order
  const sortedCategories = Object.keys(groupedWords).sort(
    (a, b) => displayOrder.indexOf(a) - displayOrder.indexOf(b)
  );

  // Icons for each category
  const categoryIcons = {
    noun: "📦",
    verb: "🏃",
    adjective: "🎨",
    adverb: "⏱️",
    pronoun: "👤",
    preposition: "🔄",
    conjunction: "🔗",
    interjection: "😲",
    article: "📝",
    determiner: "🔍"
  };

  return (
    <div className="word-categories">
      {sortedCategories.map(type => (
        <div key={type} className={`category ${type}`}>
          <div className="category-title">
            <span className="category-icon">{categoryIcons[type] || "📄"}</span>
            {typeNames[type] || type}
          </div>
          <div className="category-words">
            {groupedWords[type].map((word, index) => (
              <span key={index} className="category-word">
                {word}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
