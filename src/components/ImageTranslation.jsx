import React, { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import { translateWithGemini } from "../services/openaiTranslation";
import { LanguageControls } from "./LanguageControls";

export const ImageTranslation = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [translatedText, setTranslatedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceLang, setSourceLang] = useState("English");
  const [targetLang, setTargetLang] = useState("Vietnamese");
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file)); // Hiển thị ảnh tạm thời
      setTranslatedText(""); // Reset kết quả khi chọn ảnh mới
    }
  };

  const handleTranslate = async () => {
    if (!selectedImage) {
      alert("Vui lòng chọn hình ảnh trước!");
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { text } } = await Tesseract.recognize(selectedImage, "eng");
      const translated = await translateWithGemini(text, sourceLang, targetLang);
      setTranslatedText(translated);
    } catch (error) {
      console.error("Lỗi:", error);
      setTranslatedText("Không thể dịch văn bản.");
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white shadow-lg rounded-lg">
      <LanguageControls
        selectedSourceLang={sourceLang}
        selectedTargetLang={targetLang}
        setSelectedSourceLang={setSourceLang}
        setSelectedTargetLang={setTargetLang}
        swapLanguages={() => {
          setSourceLang(targetLang);
          setTargetLang(sourceLang);
        }}
      />

      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />

      {/* Nút chọn ảnh và dịch nằm ở giữa */}
      <div className="flex flex-col items-center gap-4">
        <button onClick={() => fileInputRef.current.click()} className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition">
          Chọn Hình Ảnh
        </button>

        <button onClick={handleTranslate} className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 transition">
          Dịch
        </button>
      </div>

      {/* Hiển thị hình ảnh đã chọn */}
      {imagePreview && (
        <div className="mt-4 text-center">
          <h3 className="text-lg font-semibold text-gray-700">Ảnh đã chọn:</h3>
          <img src={imagePreview} alt="Ảnh đã chọn" className="mt-2 mx-auto w-full max-w-xs h-auto rounded-md shadow-md" />
        </div>
      )}

      {isProcessing ? (
        <p className="text-blue-600 mt-4 text-center">Đang xử lý...</p>
      ) : translatedText && (
        <div className="mt-4 p-4 bg-gray-100 border rounded-md text-center w-full max-w-md">
          <h3 className="text-lg font-semibold text-gray-700">Bản dịch:</h3>
          <p className="text-gray-800 mt-2">{translatedText}</p>
        </div>
      )}
    </div>
  );
};

