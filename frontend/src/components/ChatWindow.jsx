import { useEffect, useRef } from "react";
import MessageInput from "./MessageInput";
import "./ChatWindow.css";

function formatTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export default function ChatWindow({
  friend,
  messages,
  currentUser,
  loading,
  error,
  aiSending,
  sendMessage,
}) {
  const messagesRef = useRef(null);
  const endOfMessagesRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const activeFriendRef = useRef(null);
  const lastMessageText = messages.at(-1)?.text;

  useEffect(() => {
    const friendChanged = activeFriendRef.current !== friend?.userId;
    activeFriendRef.current = friend?.userId;

    if (friendChanged || isAtBottomRef.current) {
      endOfMessagesRef.current?.scrollIntoView({ block: "end" });
    }
  }, [friend?.userId, messages.length, lastMessageText]);

  const handleScroll = () => {
    const container = messagesRef.current;
    if (!container) return;
    isAtBottomRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < 48;
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <span>{friend ? friend.displayName : "Messages"}</span>
      </div>

      {friend?.isAi && (
        <div className="ai-disclaimer" role="note">
          AI-powered support, not a licensed therapist or emergency service. Messages are processed by OpenAI.
        </div>
      )}

      <div className="messages" ref={messagesRef} onScroll={handleScroll}>
        {loading && <p className="chat-notice">Loading friends...</p>}
        {!loading && !friend && <p className="chat-notice">Choose a friend to view your conversation.</p>}
        {friend && !messages.length && (
          <p className="chat-notice">
            {friend.isAi
              ? "Share what is on your mind. This AI companion can help you reflect and find a next step."
              : "No messages yet. Start the conversation."}
          </p>
        )}
        {messages.map((message) => {
          const sent = message.senderId === currentUser;
          return (
            <div key={message.messageId || message.messageKey} className={`message-row ${sent ? "message-row-sent" : "message-row-received"}`}>
              {!sent && (
                <div className="message-avatar" aria-hidden="true">
                  {friend.isAi
                    ? <i className="material-symbols-rounded">psychology</i>
                    : friend.displayName.slice(0, 1)}
                </div>
              )}
              <div className="message-content">
                <div className={`message ${sent ? "sent" : "received"} ${message.streaming ? "streaming" : ""}`}>
                  {message.text}
                  {message.streaming && <span className="streaming-cursor" aria-hidden="true" />}
                </div>
                {!message.streaming && <span className="message-time">{formatTime(message.sentAt)}</span>}
              </div>
            </div>
          );
        })}
        {friend?.isAi && aiSending && (
          <div className="ai-thinking" role="status">
            {messages.some((message) => message.streaming)
              ? "Therapist is responding..."
              : "Therapist is thinking..."}
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="chat-footer">
        {error && <p className="chat-error">{error}</p>}
        <MessageInput
          key={friend?.userId || "no-friend"}
          sendMessage={sendMessage}
          disabled={!friend || aiSending}
          friend={friend}
          checkIn={friend?.isAi ? null : friend?.latestCheckIn}
        />
      </div>
    </div>
  );
}
