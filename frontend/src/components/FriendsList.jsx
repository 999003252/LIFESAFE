import { useState } from "react";
import AddFriendModal from "./AddFriendModal";
import "./Friends.css";

const friends = [
  "Sarah",
  "John",
  "Mike",
  "Emily",
  "Alex"
];

export default function FriendsList({
  selectedFriend,
  setSelectedFriend,
  conversations,
  isCollapsed,
  onToggleCollapsed
}) {

  const [showModal, setShowModal] = useState(false);

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
            <button
              type="button"
              className="add-friend"
              onClick={() => setShowModal(true)}
              aria-label="Add friend"
            >
              +
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          <input
            className="search-bar"
            type="text"
            placeholder="Search friends..."
          />

          {friends.map((friend) => (
            <div
              key={friend}
              className={`friend-card ${
                selectedFriend === friend ? "active" : ""
              }`}
              onClick={() => setSelectedFriend(friend)}
            >
              <div className="avatar"></div>

              <div className="friend-info">
                <h4>{friend}</h4>
                <p>
                  {conversations[friend][conversations[friend].length - 1].text.slice(0, 30)}
                  {conversations[friend][conversations[friend].length - 1].text.length > 30 && "..."}
                </p>
              </div>
            </div>
          ))}
        </>
      )}

      {showModal && (
        <AddFriendModal
          onClose={() => setShowModal(false)}
        />
      )}

    </div>
  );
}
