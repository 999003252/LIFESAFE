import { useState } from "react";
import "./MessageInput.css";

export default function MessageInput({ sendMessage, disabled }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (text.trim() && sendMessage(text)) setText("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="message-input">
      <input
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      <button type="button" onClick={handleSend} disabled={disabled}>
        Send
      </button>
    </div>
  );
}
