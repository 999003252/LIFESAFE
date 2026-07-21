import MessageInput from "./MessageInput";
import "./ChatWindow.css";

export default function ChatWindow({ friend, messages, sendMessage }) {
  return (
    <div className="chat-window">

      <div className="chat-header">
        {friend}
      </div>

      <div className="messages">
      {messages.map((message, index) => (
  <div
    key={index}
    className={`message-row ${
      message.sender === "You"
        ? "message-row-sent"
        : "message-row-received"
    }`}
  >
    {message.sender !== "You" && (
      <div className="message-avatar"></div>
    )}

    <div className="message-content">
      <div
        className={`message ${
          message.sender === "You"
            ? "sent"
            : "received"
        }`}
      >
        {message.text}
      </div>

      <span className="message-time">
        10:42 AM
      </span>
    </div>

    {message.sender === "You" && (
      <div className="message-avatar"></div>
    )}
  </div>
))}
      </div>

      <div className="chat-footer">
        <MessageInput sendMessage={sendMessage} />
      </div>

    </div>
  );
}
