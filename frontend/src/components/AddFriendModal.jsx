import "./AddFriendModal.css";

export default function AddFriendModal({ onClose }) {
    const users = [
      "Jacob Smith",
      "Emma Wilson",
      "Olivia Brown",
      "Liam Davis",
      "Sophia Miller"
    ];
  
    return (
      <div className="modal-overlay">
  
        <div className="modal">
  
          <h2>Add Friend</h2>
  
          <input
            className="friend-search"
            type="text"
            placeholder="Search for a friend..."
          />
  
          <div className="search-results">
  
            {users.map((user) => (
              <div className="search-user" key={user}>
  
                <div className="avatar"></div>
  
                <span>{user}</span>
  
                <button className="add-button">
                  Add
                </button>
  
              </div>
            ))}
  
          </div>
  
          <button
            className="close-button"
            onClick={onClose}
          >
            Close
          </button>
  
        </div>
  
      </div>
    );
  }