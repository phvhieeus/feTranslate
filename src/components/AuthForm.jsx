import React, { useState } from "react";
import "boxicons/css/boxicons.min.css";
import axios from "axios";

const AuthForm = ({ onLoginSuccess, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegisterClick = () => {
    setIsActive(true);
    setError("");
  };

  const handleLoginClick = () => {
    setIsActive(false);
    setError("");
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData({
      ...loginData,
      [name]: value,
    });
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData({
      ...registerData,
      [name]: value,
    });
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/auth/login", {
        username: loginData.username,
        password: loginData.password,
      });

      if (response.data) {
        // response.data sẽ chứa thông tin user từ database
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("accessToken", response.data.accessToken);
        if (onLoginSuccess) onLoginSuccess(response.data.user);
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed. Please check your information."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/auth/register", {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
      });

      if (response.data) {
        alert("Registration successful! Please log in.");
        setIsActive(false);
        setLoginData({
          username: registerData.email,
          password: "",
        });
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Registration failed. Please check your information."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className={`auth-container container ${isActive ? "active" : ""}`}>
        <button className="close-btn" onClick={onClose}>
          <i className="bx bx-x"></i>
        </button>

        <div className="form-box login">
          <form onSubmit={handleSubmitLogin}>
            <h1>Log In</h1>
            {error && !isActive && <div className="error-message">{error}</div>}
            <div className="input-box">
              <input
                type="text"
                name="username"
                placeholder="Email"
                required
                value={loginData.username}
                onChange={handleLoginChange}
              />
              <i className="bx bxs-user"></i>
            </div>
            <div className="input-box">
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                value={loginData.password}
                onChange={handleLoginChange}
              />
              <i className="bx bxs-lock-alt"></i>
            </div>
            <div className="forgot-link">
              <a href="#">Forgot password?</a>
            </div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Processing..." : "Login"}
            </button>
            <p>or log in with</p>
            <div className="social-icons">
              <a href="#">
                <i className="bx bxl-google"></i>
              </a>
              <a href="#">
                <i className="bx bxl-facebook"></i>
              </a>
              <a href="#">
                <i className="bx bxl-github"></i>
              </a>
              <a href="#">
                <i className="bx bxl-linkedin"></i>
              </a>
            </div>
          </form>
        </div>

        <div className="form-box register">
          <form onSubmit={handleSubmitRegister}>
            <h1>Sign Up</h1>
            {error && isActive && <div className="error-message">{error}</div>}
            <div className="input-box">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                required
                value={registerData.name}
                onChange={handleRegisterChange}
              />
              <i className="bx bxs-user"></i>
            </div>
            <div className="input-box">
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                value={registerData.email}
                onChange={handleRegisterChange}
              />
              <i className="bx bxs-envelope"></i>
            </div>
            <div className="input-box">
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                value={registerData.password}
                onChange={handleRegisterChange}
              />
              <i className="bx bxs-lock-alt"></i>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Processing..." : "Sign Up"}
            </button>
          </form>
        </div>

        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1>Hello!</h1>
            <p>Don't have an account?</p>

            <button className="btn register-btn" onClick={handleRegisterClick}>
              Sign Up
            </button>
          </div>

          <div className="toggle-panel toggle-right">
            <h1>WELLCOME</h1>
            <p>Already have an account?</p>
            <button className="btn login-btn" onClick={handleLoginClick}>
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
