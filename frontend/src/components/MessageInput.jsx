import { useState } from "react";
import "./MessageInput.css";

const suggestedReplies = [
  "Hey, how are you doing?",
  "Want to talk?",
  "I’m here if you need me.",
];

export default function MessageInput({ sendMessage, disabled, friend, checkIn }) {
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
    <>
      {checkIn && (
        <div className={`check-in-context ${checkIn.wantsCheckIn ? "wants-support" : ""}`}>
          <div className="check-in-context-heading">
            <i className="material-symbols-rounded">{checkIn.moodIcon}</i>
            <div>
              <strong>{friend.displayName} is feeling {checkIn.moodLabel.toLowerCase()}</strong>
              {checkIn.wantsCheckIn && <span>They’d appreciate someone checking in.</span>}
            </div>
          </div>
          {checkIn.message && <blockquote>“{checkIn.message}”</blockquote>}
          <div className="suggested-replies" aria-label="Suggested replies">
            {suggestedReplies.map((reply) => (
              <button type="button" key={reply} onClick={() => setText(reply)}>
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

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
    </>
  );
}
