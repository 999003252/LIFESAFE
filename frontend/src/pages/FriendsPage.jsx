import { useCallback, useEffect, useRef, useState } from "react";
import { getAuth, getCookieValue, setCookieValue } from "../auth";
import {
  fetchFriends,
  fetchMessages,
  fetchRealtimeConfig,
  markFriendRead,
  streamAiMessage,
} from "../api/friends";
import FriendsList from "../components/FriendsList";
import ChatWindow from "../components/ChatWindow";
import "./FriendsPage.css";

export default function FriendsPage() {
  const currentUser = getAuth();
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [conversations, setConversations] = useState({});
  const [friendsMenuMinimized, setFriendsMenuMinimized] = useState(
    () => getCookieValue("lifesafe_friends_collapsed") === "true"
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiSending, setAiSending] = useState(false);
  const socketRef = useRef(null);
  const selectedFriendRef = useRef(null);
  const pendingAiMessageRef = useRef(null);

  useEffect(() => {
    selectedFriendRef.current = selectedFriend;
  }, [selectedFriend]);

  useEffect(() => {
    let active = true;

    fetchFriends(currentUser)
      .then((nextFriends) => {
        if (!active) return;
        setError("");
        setFriends(nextFriends);
        setSelectedFriend((current) => (
          nextFriends.find((friend) => friend.userId === current?.userId)
          || nextFriends[0]
          || null
        ));
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!selectedFriend) return;

    fetchMessages(currentUser, selectedFriend.userId)
      .then((messages) => {
        setConversations((current) => ({ ...current, [selectedFriend.userId]: messages }));
        return markFriendRead(currentUser, selectedFriend.userId);
      })
      .then(() => setFriends((current) => current.map((friend) => (
        friend.userId === selectedFriend.userId
          ? { ...friend, unreadCount: 0, checkInUnread: false }
          : friend
      ))))
      .catch((loadError) => setError(loadError.message));
  }, [currentUser, selectedFriend]);

  const handleMessagePayload = useCallback((payload) => {
    if (payload.type === "messageError" || payload.type === "aiMessageError") {
      setAiSending(false);
      if (payload.type === "messageError" && pendingAiMessageRef.current) {
        const pending = pendingAiMessageRef.current;
        pendingAiMessageRef.current = null;
        setConversations((current) => ({
          ...current,
          [pending.friendId]: (current[pending.friendId] || []).filter(
            (message) => message.messageId !== pending.messageId
          ),
        }));
      }
      if (payload.type === "aiMessageError") {
        setConversations((current) => {
          const existing = current[payload.friendId] || [];
          return {
            ...current,
            [payload.friendId]: existing.filter(
              (message) => message.messageId !== payload.messageId
            ),
          };
        });
      }
      setError(payload.detail || "The message could not be sent.");
      return;
    }

    if (payload.type === "aiMessageStarted") {
      const message = { ...payload.message, streaming: true };
      const friendId = message.senderId;
      setAiSending(true);
      setError("");
      setConversations((current) => {
        const existing = current[friendId] || [];
        if (existing.some((item) => item.messageId === message.messageId)) return current;
        return { ...current, [friendId]: [...existing, message] };
      });
      return;
    }

    if (payload.type === "aiMessageDelta") {
      setConversations((current) => ({
        ...current,
        [payload.friendId]: (current[payload.friendId] || []).map((message) => (
          message.messageId === payload.messageId
            ? { ...message, text: `${message.text}${payload.delta}` }
            : message
        )),
      }));
      return;
    }

    if (payload.type === "aiMessageCompleted") {
      const message = payload.message;
      const friendId = message.senderId;
      setAiSending(false);
      setError("");
      setConversations((current) => ({
        ...current,
        [friendId]: (current[friendId] || []).map((item) => (
          item.messageId === message.messageId ? message : item
        )),
      }));
      setFriends((current) => current.map((friend) => (
        friend.userId === friendId
          ? {
            ...friend,
            lastMessagePreview: message.text,
            lastMessageAt: message.sentAt,
          }
          : friend
      )));
      return;
    }

    if (payload.type !== "message") return;

    setError("");
    const message = payload.message;
    const friendId = message.senderId === currentUser ? message.recipientId : message.senderId;
    const isIncoming = message.recipientId === currentUser;
    const isOpenConversation = selectedFriendRef.current?.userId === friendId;
    const pending = pendingAiMessageRef.current;
    const replacesPending = (
      pending
      && pending.friendId === friendId
      && message.senderId === currentUser
      && message.text === pending.text
    );
    if (replacesPending) pendingAiMessageRef.current = null;
    setConversations((current) => {
      const existing = current[friendId] || [];
      if (replacesPending) {
        return {
          ...current,
          [friendId]: existing.some((item) => item.messageId === pending.messageId)
            ? existing.map((item) => (
              item.messageId === pending.messageId ? message : item
            ))
            : [...existing, message],
        };
      }
      if (existing.some((item) => item.messageId === message.messageId)) return current;
      return { ...current, [friendId]: [...existing, message] };
    });
    setFriends((current) => current.map((friend) => (
      friend.userId === friendId
        ? {
          ...friend,
          lastMessagePreview: message.text,
          lastMessageAt: message.sentAt,
          unreadCount: isIncoming && !isOpenConversation ? (friend.unreadCount || 0) + 1 : 0,
        }
        : friend
    )));
    if (isIncoming && isOpenConversation) {
      markFriendRead(currentUser, friendId).catch(() => {});
    }
  }, [currentUser]);

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
          handleMessagePayload(JSON.parse(event.data));
        };
        socket.onclose = () => {
          setAiSending(false);
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
  }, [currentUser, handleMessagePayload]);

  const sendMessage = (text) => {
    if (!selectedFriend) {
      setError("Choose a contact before sending a message.");
      return false;
    }

    if (selectedFriend.isAi) {
      const friendId = selectedFriend.userId;
      const optimisticMessage = {
        messageId: `pending-${crypto.randomUUID()}`,
        senderId: currentUser,
        recipientId: friendId,
        text,
        sentAt: new Date().toISOString(),
        pending: true,
      };
      pendingAiMessageRef.current = {
        friendId,
        messageId: optimisticMessage.messageId,
        text,
      };
      setConversations((current) => ({
        ...current,
        [friendId]: [...(current[friendId] || []), optimisticMessage],
      }));
      setError("");
      setAiSending(true);
      streamAiMessage(currentUser, text, handleMessagePayload).catch((streamError) => {
        setAiSending(false);
        if (pendingAiMessageRef.current?.messageId === optimisticMessage.messageId) {
          pendingAiMessageRef.current = null;
        }
        setConversations((current) => ({
          ...current,
          [friendId]: (current[friendId] || []).filter(
            (message) => (
              message.messageId !== optimisticMessage.messageId
              && !message.streaming
            )
          ),
        }));
        setError(streamError.message || "Therapist could not respond.");
      });
      return true;
    }

    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      setError("Messaging is reconnecting. Please try again.");
      return false;
    }

    socketRef.current.send(JSON.stringify({
      action: "sendMessage",
      recipientId: selectedFriend.userId,
      text,
    }));
    setError("");
    return true;
  };

  const handleFriendAdded = (friend) => {
    setFriends((current) => [...current, { ...friend, lastMessagePreview: "No messages yet", unreadCount: 0 }]);
    setSelectedFriend(friend);
  };

  const toggleFriendsMenu = () => {
    setFriendsMenuMinimized((current) => {
      const next = !current;
      setCookieValue("lifesafe_friends_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className={`friends-page ${friendsMenuMinimized ? "friends-menu-minimized" : ""}`}>
      <FriendsList
        currentUser={currentUser}
        friends={friends}
        selectedFriend={selectedFriend}
        setSelectedFriend={setSelectedFriend}
        isCollapsed={friendsMenuMinimized}
        onToggleCollapsed={toggleFriendsMenu}
        onFriendAdded={handleFriendAdded}
      />

      <ChatWindow
        friend={selectedFriend}
        messages={selectedFriend ? conversations[selectedFriend.userId] || [] : []}
        currentUser={currentUser}
        loading={loading}
        error={error}
        aiSending={selectedFriend?.isAi && aiSending}
        sendMessage={sendMessage}
      />
    </div>
  );
}
