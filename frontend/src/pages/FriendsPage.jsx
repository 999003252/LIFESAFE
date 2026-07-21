import { useCallback, useEffect, useRef, useState } from "react";
import { getAuth } from "../auth";
import { fetchFriends, fetchMessages, fetchRealtimeConfig } from "../api/friends";
import FriendsList from "../components/FriendsList";
import ChatWindow from "../components/ChatWindow";
import "./FriendsPage.css";

export default function FriendsPage() {
  const currentUser = getAuth();
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [conversations, setConversations] = useState({});
  const [friendsMenuMinimized, setFriendsMenuMinimized] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const refreshFriends = useCallback(async () => {
    try {
      setError("");
      const nextFriends = await fetchFriends(currentUser);
      setFriends(nextFriends);
      setSelectedFriend((current) => nextFriends.find((friend) => friend.userId === current?.userId) || nextFriends[0] || null);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshFriends();
  }, [refreshFriends]);

  useEffect(() => {
    if (!selectedFriend) return;

    fetchMessages(currentUser, selectedFriend.userId)
      .then((messages) => {
        setConversations((current) => ({ ...current, [selectedFriend.userId]: messages }));
      })
      .catch((loadError) => setError(loadError.message));
  }, [currentUser, selectedFriend]);

  useEffect(() => {
    let socket;
    let reconnectTimer;
    let stopped = false;

    const connect = async () => {
      try {
        const { websocketUrl } = await fetchRealtimeConfig();
        if (!websocketUrl || stopped) return;

        socket = new WebSocket(`${websocketUrl}?userId=${encodeURIComponent(currentUser)}`);
        socketRef.current = socket;
        socket.onmessage = (event) => {
          const payload = JSON.parse(event.data);
          if (payload.type !== "message") return;

          const message = payload.message;
          const friendId = message.senderId === currentUser ? message.recipientId : message.senderId;
          setConversations((current) => {
            const existing = current[friendId] || [];
            if (existing.some((item) => item.messageId === message.messageId)) return current;
            return { ...current, [friendId]: [...existing, message] };
          });
          setFriends((current) => current.map((friend) => (
            friend.userId === friendId
              ? { ...friend, lastMessagePreview: message.text, lastMessageAt: message.sentAt }
              : friend
          )));
        };
        socket.onclose = () => {
          if (!stopped) reconnectTimer = window.setTimeout(connect, 2000);
        };
      } catch {
        if (!stopped) reconnectTimer = window.setTimeout(connect, 4000);
      }
    };

    connect();
    return () => {
      stopped = true;
      window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [currentUser]);

  const sendMessage = (text) => {
    if (!selectedFriend || socketRef.current?.readyState !== WebSocket.OPEN) {
      setError("Messaging is reconnecting. Please try again.");
      return false;
    }

    socketRef.current.send(JSON.stringify({
      action: "sendMessage",
      recipientId: selectedFriend.userId,
      text,
    }));
    return true;
  };

  const handleFriendAdded = (friend) => {
    setFriends((current) => [...current, { ...friend, lastMessagePreview: "No messages yet" }]);
    setSelectedFriend(friend);
  };

  return (
    <div className={`friends-page ${friendsMenuMinimized ? "friends-menu-minimized" : ""}`}>
      <FriendsList
        currentUser={currentUser}
        friends={friends}
        selectedFriend={selectedFriend}
        setSelectedFriend={setSelectedFriend}
        isCollapsed={friendsMenuMinimized}
        onToggleCollapsed={() => setFriendsMenuMinimized((current) => !current)}
        onFriendAdded={handleFriendAdded}
      />

      <ChatWindow
        friend={selectedFriend}
        messages={selectedFriend ? conversations[selectedFriend.userId] || [] : []}
        currentUser={currentUser}
        loading={loading}
        error={error}
        sendMessage={sendMessage}
      />
    </div>
  );
}
