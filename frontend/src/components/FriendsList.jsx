import { useMemo, useState } from "react";
import AddFriendModal from "./AddFriendModal";
import "./Friends.css";

function initials(name) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function FriendAvatar({ friend }) {
  if (friend.isAi) {
    return (
      <span className="avatar ai-avatar" aria-hidden="true">
        <i className="material-symbols-rounded">psychology</i>
      </span>
    );
  }

  if (friend.profilePictureUrl) {
    return <img className="avatar" src={friend.profilePictureUrl} alt="" />;
  }

  return <span className="avatar" aria-hidden="true">{initials(friend.displayName)}</span>;
}

function checkInSummary(checkIn) {
  if (checkIn.wantsCheckIn) return "Could use a check-in";
  return `Feeling ${checkIn.moodLabel.toLowerCase()}`;
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
        <h2>Messages</h2>

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
            placeholder="Search contacts"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className="friends-results">
            {visibleFriends.map((friend) => (
              <div
                key={friend.userId}
                className={`friend-card ${selectedFriend?.userId === friend.userId ? "active" : ""} ${friend.latestCheckIn ? "has-check-in-content" : ""} ${friend.checkInUnread ? "has-check-in" : ""}`}
              >
                <button
                  type="button"
                  className="friend-card-main"
                  onClick={() => setSelectedFriend(friend)}
                >
                  <FriendAvatar friend={friend} />
                  <div className="friend-info">
                    <h4>{friend.displayName}</h4>
                    {friend.isAi && <span className="ai-label">AI</span>}
                    {friend.latestCheckIn ? (
                      <p className="friend-check-in-summary">
                        <i className="material-symbols-rounded">{friend.latestCheckIn.moodIcon}</i>
                        {checkInSummary(friend.latestCheckIn)}
                      </p>
                    ) : (
                      <p>{friend.lastMessagePreview || "No messages yet"}</p>
                    )}
                  </div>
                  {!!friend.unreadCount && <i className="material-symbols-rounded unread-bell" aria-label={`${friend.unreadCount} unread messages`}>notifications</i>}
                </button>
                {friend.latestCheckIn && !friend.isAi && (
                  <button
                    type="button"
                    className="check-in-button"
                    onClick={() => setSelectedFriend(friend)}
                    aria-label={`Check in with ${friend.displayName}`}
                  >
                    Check in
                  </button>
                )}
              </div>
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
              <FriendAvatar friend={friend} />
              {!!friend.unreadCount && <i className="material-symbols-rounded unread-bell" aria-label={`${friend.unreadCount} unread messages`}>notifications</i>}
              {friend.checkInUnread && <i className="material-symbols-rounded check-in-badge" aria-label={`${friend.displayName} shared a check-in`}>favorite</i>}
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
