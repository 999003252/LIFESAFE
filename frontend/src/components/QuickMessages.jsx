export default function QuickMessages({ sendMessage }) {
    const messages = [
      "How are you feeling?",
      "Need to talk?",
      "I'm here for you",
      "Let's check in"
    ];
  
    return (
      <div className="quick-messages">
        {messages.map((message) => (
          <button key={message} className="quick-message" onClick={() => sendMessage(message)}>
            {message}
          </button>
        ))}
      </div>
    );
  }