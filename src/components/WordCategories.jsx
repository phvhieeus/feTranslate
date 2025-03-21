import React from 'react';

export function WordCategories({ translation, partsOfSpeech }) {
  if (!translation || !partsOfSpeech || partsOfSpeech.length === 0) return null;
  
  // Nhóm từ theo loại
  const groupedWords = partsOfSpeech.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    
    // Kiểm tra xem từ đã tồn tại trong nhóm chưa
    if (!acc[item.type].includes(item.word)) {
      acc[item.type].push(item.word);
    }
    
    return acc;
  }, {});
  
  // Map các loại từ sang tiếng Việt
  const typeNames = {
    'noun': 'Danh từ',
    'verb': 'Động từ',
    'adjective': 'Tính từ',
    'adverb': 'Trạng từ',
    'pronoun': 'Đại từ',
    'preposition': 'Giới từ',
    'conjunction': 'Liên từ',
    'interjection': 'Thán từ',
    'article': 'Mạo từ',
    'determiner': 'Từ hạn định'
  };
  
  // Thứ tự hiển thị các loại từ
  const typeOrder = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection', 'article', 'determiner'];
  
  // Sắp xếp các loại từ theo thứ tự đã định
  const sortedTypes = Object.keys(groupedWords).sort((a, b) => {
    const indexA = typeOrder.indexOf(a);
    const indexB = typeOrder.indexOf(b);
    
    // Nếu không tìm thấy trong danh sách, đặt ở cuối
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });
  
  return (
    <div className="word-categories">
      {sortedTypes.map((type) => (
        <div key={type} className={`category ${type}`}>
          <h4 className="category-title">{typeNames[type] || type}</h4>
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
