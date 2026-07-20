import React, { useState } from "react";

interface MaskedWordProps {
  word: string;
  revealed: boolean;
  hint?: string; // guessed word
}

const MaskedWord: React.FC<MaskedWordProps> = ({ word, revealed, hint }) => {
  const [showLength, setShowLength] = useState(false);
  const widthCh = word.length + 0.5;

  const handleClick = () => {
    if (revealed) return;
    setShowLength(true);
    setTimeout(() => setShowLength(false), 1000); // fade out after 1s
  };

  // ✅ If revealed, just show plain text without masking box
  if (revealed) {
    return <span className="m-0.5">{word}</span>;
  }

  return (
    <span
      className="inline-block m-0.5 px-1 py-0.5 border rounded-md text-center align-middle relative cursor-pointer"
      style={{
        minWidth: `${widthCh}ch`,
        height: "1.5em",
        lineHeight: "1.5em",
        backgroundColor: "#9ca3af",
        color: hint ? "white" : "#9ca3af", // ✅ white text for hints
        fontWeight: hint ? "bold" : "normal",
        position: "relative",
      }}
      onClick={handleClick}
    >
      {hint && (
        <span
          style={{
            display: "inline-block",
            position: "relative",
            top: "-0.2em", // ✅ moves hint slightly up
          }}
        >
          {hint}
        </span>
      )}

      {!hint && ""}
      {showLength && (
        <span
          className="absolute inset-0 flex items-center justify-center text-white font-bold"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            animation: "fadeOut 1s forwards",
          }}
        >
          {word.length}
        </span>
      )}
    </span>
  );
};

export default MaskedWord;
