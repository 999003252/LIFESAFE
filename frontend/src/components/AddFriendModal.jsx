import { useEffect, useState } from "react";
import { addFriend, searchUsers } from "../api/friends";
import "./AddFriendModal.css";

function initials(name) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function UserAvatar({ user }) {
  if (user.profilePictureUrl) {
    return <img className="avatar" src={user.profilePictureUrl} alt="" />;
  }

  return <span className="avatar" aria-hidden="true">{initials(user.displayName)}</span>;
}

export default function AddFriendModal({ currentUser, onAdded, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [addingId, setAddingId] = useState("");

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError("");
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      try {
        setError("");
        setResults(await searchUsers(query, currentUser));
      } catch (searchError) {
        setError(searchError.message);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [currentUser, query]);

  const handleAdd = async (friendId) => {
    try {
      setAddingId(friendId);
      const friend = await addFriend(currentUser, friendId);
      onAdded(friend);
      onClose();
    } catch (addError) {
      setError(addError.message);
    } finally {
      setAddingId("");
    }
  };

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-friend-title" onMouseDown={(event) => event.stopPropagation()}>
        <h2 id="add-friend-title">Add Friend</h2>
        <p>Search by a registered name or email.</p>

        <input
          className="friend-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search registered users"
          autoFocus
        />

        {error && <p className="modal-error">{error}</p>}

        <div className="search-results">
          {results.map((user) => (
            <div className="search-user" key={user.userId}>
              <UserAvatar user={user} />
              <div>
                <span>{user.displayName}</span>
                <small>{user.userId}</small>
              </div>
              <button
                className="add-button"
                type="button"
                onClick={() => handleAdd(user.userId)}
                disabled={addingId === user.userId}
              >
                {addingId === user.userId ? "Adding" : "Add"}
              </button>
            </div>
          ))}
          {query.trim().length >= 2 && !error && results.length === 0 && (
            <p className="empty-search">No registered users found.</p>
          )}
        </div>

        <button className="close-button" type="button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
