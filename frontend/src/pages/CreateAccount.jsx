import React, { useState } from "react";
import "../pages/CreateAccount.css";

function CreateAccount() {
  const [profileImage, setProfileImage] = useState(null);

  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (file) {
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (email !== confirmEmail) {
      alert("Emails do not match. Please check and try again.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match. Please check and try again.");
      return;
    }

    // Frontend only for now
    console.log("Account information submitted");
    alert("Account created successfully!");
  };

  return (
    <div className="create-account-page">

      <div className="create-account-card">

        <h1>Create Account</h1>

        <p className="subtitle">
          Create your profile to start your wellness journey.
        </p>


        <div className="profile-upload">

          <label htmlFor="profile-picture">

            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile Preview"
                className="profile-preview"
              />
            ) : (
              <div className="profile-placeholder">
                +
              </div>
            )}

          </label>


          <input
            id="profile-picture"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />

          <p>Upload Profile Picture</p>

        </div>


        <form onSubmit={handleSubmit}>

          <div className="name-row">

            <div className="input-group">
              <label>First Name</label>

              <input
                type="text"
                placeholder="First name"
              />

            </div>


            <div className="input-group">
              <label>Last Name</label>

              <input
                type="text"
                placeholder="Last name"
              />

            </div>

          </div>



          <div className="input-group">

            <label>Email</label>

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

          </div>



          <div className="input-group">

            <label>Confirm Email</label>

            <input
              type="email"
              placeholder="Confirm email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
            />

          </div>



          <div className="input-group">

            <label>Password</label>

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

          </div>



          <div className="input-group">

            <label>Confirm Password</label>

            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

          </div>



          <button className="create-button">
            Create Account
          </button>


        </form>

      </div>

    </div>
  );
}

export default CreateAccount;