import { useState } from "react";
import FriendsList from "../components/FriendsList";
import ChatWindow from "../components/ChatWindow";
import "./FriendsPage.css";

export default function FriendsPage() {
  const [selectedFriend, setSelectedFriend] = useState("Sarah");

  const [conversations, setConversations] = useState({
    Sarah: [
      { sender: "Sarah", text: "Hey! How are you?" },
      { sender: "You", text: "Doing well!" }
    ],
  
    John: [
      { sender: "John", text: "Want to grab lunch?" },
      { sender: "You", text: "Sure!" }
    ],
  
    Mike: [
      { sender: "Mike", text: "Gym tonight?" },
      { sender: "You", text: "Absolutely." }
    ],
  
    Emily: [
      { sender: "Emily", text: "How was your day?" }
    ],
  
    Alex: [
      { sender: "Alex", text: "Let's catch up soon." }
    ]
  });

  const sendMessage = (text) => {
    if (!text.trim()) return;
  
    setConversations((prev) => ({
      ...prev,
  
      [selectedFriend]: [
        ...prev[selectedFriend],
  
        {
          sender: "You",
          text: text,
        },
      ],
    }));
  };

  return (
    <div className="friends-page">
      <FriendsList
        selectedFriend={selectedFriend}
        setSelectedFriend={setSelectedFriend}
        conversations={conversations}
      />

      <ChatWindow
        friend={selectedFriend}
        messages={conversations[selectedFriend]}
        sendMessage={sendMessage}
      />
    </div>
  );
}
