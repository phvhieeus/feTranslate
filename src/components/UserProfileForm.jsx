import React, { useState } from "react";
import axios from "axios";

const UserProfileForm = ({ user, onClose, onUpdateSuccess }) => {
  const [userData, setUserData] = useState({
    name: user?.name || "",
    email: user?.email || "", // Email sẽ được lấy từ thông tin user hiện tại
    phone: user?.phone || "",
    age: user?.age || "",
    address: user?.address || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate password if changing
    if (showPasswordFields) {
      if (userData.newPassword !== userData.confirmPassword) {
        setError("New passwords do not match");
        setLoading(false);
        return;
      }
    }

    try {
      const dataToUpdate = {
        name: userData.name,
        phone: userData.phone,
        age: userData.age,
        address: userData.address,
      };

      if (showPasswordFields) {
        dataToUpdate.currentPassword = userData.currentPassword;
        dataToUpdate.newPassword = userData.newPassword;
      }

      const response = await axios.put("/auth/update-profile", dataToUpdate, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.data) {
        localStorage.setItem("user", JSON.stringify(response.data));
        onUpdateSuccess(response.data);
        onClose();
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-form-overlay">
      <div className="profile-form-container">
        <div className="profile-form-header">
          <h2>Update Profile</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="bx bx-x"></i>
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <div className="input-group">
              <i className="bx bxs-user"></i>
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={userData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-group">
              <i className="bx bxs-envelope"></i>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={user?.email || ""}
                readOnly
                className="readonly-input"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-group">
              <i className="bx bxs-phone"></i>
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={userData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-group">
              <i className="bx bxs-calendar"></i>
              <input
                type="number"
                name="age"
                placeholder="Age"
                value={userData.age}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-group">
              <i className="bx bxs-map"></i>
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={userData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="password-section">
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPasswordFields(!showPasswordFields)}
            >
              {showPasswordFields
                ? "Cancel Password Change"
                : "Change Password"}
            </button>

            {showPasswordFields && (
              <>
                <div className="form-group">
                  <div className="input-group">
                    <i className="bx bxs-lock"></i>
                    <input
                      type="password"
                      name="currentPassword"
                      placeholder="Current Password"
                      value={userData.currentPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="input-group">
                    <i className="bx bxs-lock-alt"></i>
                    <input
                      type="password"
                      name="newPassword"
                      placeholder="New Password"
                      value={userData.newPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="input-group">
                    <i className="bx bxs-lock-alt"></i>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm New Password"
                      value={userData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="update-btn" disabled={loading}>
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileForm;
