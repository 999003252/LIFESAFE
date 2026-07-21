import MessageInput from "./MessageInput";
import "./ChatWindow.css";

function formatTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export default function ChatWindow({ friend, messages, currentUser, loading, error, sendMessage }) {
  return (
    <div className="chat-window">
      <div className="chat-header">{friend ? friend.displayName : "Messages"}</div>

      <div className="messages">
        {loading && <p className="chat-notice">Loading friends...</p>}
        {!loading && !friend && <p className="chat-notice">Choose a friend to view your conversation.</p>}
        {friend && !messages.length && <p className="chat-notice">No messages yet. Start the conversation.</p>}
        {messages.map((message) => {
          const sent = message.senderId === currentUser;
          return (
            <div key={message.messageId || message.messageKey} className={`message-row ${sent ? "message-row-sent" : "message-row-received"}`}>
              {!sent && <div className="message-avatar" aria-hidden="true">{friend.displayName.slice(0, 1)}</div>}
              <div className="message-content">
                <div className={`message ${sent ? "sent" : "received"}`}>{message.text}</div>
                <span className="message-time">{formatTime(message.sentAt)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="chat-footer">
        {error && <p className="chat-error">{error}</p>}
        <MessageInput sendMessage={sendMessage} disabled={!friend} />
      </div>
    </div>
  );
}
