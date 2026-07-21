import { useMemo, useState } from "react";
import AddFriendModal from "./AddFriendModal";
import "./Friends.css";

function initials(name) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function FriendsList({
  currentUser,
  friends,
  selectedFriend,
  setSelectedFriend,
  isCollapsed,
  onToggleCollapsed,
  onFriendAdded,
}) {
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState("");
  const visibleFriends = useMemo(
    () => friends.filter((friend) => friend.displayName.toLowerCase().includes(query.trim().toLowerCase())),
    [friends, query]
  );

  return (
    <div className={`friends-list ${isCollapsed ? "is-collapsed" : ""}`}>
      <div className="friends-header">
        <h2>Friends</h2>

        <div className="friends-actions">
          <button
            type="button"
            className="friends-toggle"
            onClick={onToggleCollapsed}
            aria-label={isCollapsed ? "Expand friends menu" : "Minimize friends menu"}
            title={isCollapsed ? "Expand friends menu" : "Minimize friends menu"}
          >
            {isCollapsed ? "›" : "‹"}
          </button>

          {!isCollapsed && (
            <button type="button" className="add-friend" onClick={() => setShowModal(true)} aria-label="Add friend">+</button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          <input
            className="search-bar"
            type="search"
            placeholder="Search friends"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className="friends-results">
            {visibleFriends.map((friend) => (
              <button
                type="button"
                key={friend.userId}
                className={`friend-card ${selectedFriend?.userId === friend.userId ? "active" : ""}`}
                onClick={() => setSelectedFriend(friend)}
              >
                <div className="avatar" aria-hidden="true">{initials(friend.displayName)}</div>
                <div className="friend-info">
                  <h4>{friend.displayName}</h4>
                  <p>{friend.lastMessagePreview || "No messages yet"}</p>
                </div>
                {!!friend.unreadCount && <i className="material-symbols-rounded unread-bell" aria-label={`${friend.unreadCount} unread messages`}>notifications</i>}
              </button>
            ))}

            {!friends.length && <p className="friends-empty">Add a registered user to start a conversation.</p>}
            {!!friends.length && !visibleFriends.length && <p className="friends-empty">No friends match that search.</p>}
          </div>
        </>
      )}

      {isCollapsed && (
        <div className="collapsed-friends">
          {friends.map((friend) => (
            <button
              type="button"
              key={friend.userId}
              className={`collapsed-friend ${selectedFriend?.userId === friend.userId ? "active" : ""}`}
              onClick={() => setSelectedFriend(friend)}
              title={friend.displayName}
              aria-label={`Open conversation with ${friend.displayName}`}
            >
              <span className="avatar" aria-hidden="true">{initials(friend.displayName)}</span>
              {!!friend.unreadCount && <i className="material-symbols-rounded unread-bell" aria-label={`${friend.unreadCount} unread messages`}>notifications</i>}
            </button>
          ))}
        </div>
      )}

      {showModal && (
        <AddFriendModal
          currentUser={currentUser}
          onAdded={onFriendAdded}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
