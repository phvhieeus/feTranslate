import React, { useState } from "react";
import "boxicons/css/boxicons.min.css";

const AuthForm = ({ onLoginSuccess, onClose }) => {
  const [isActive, setIsActive] = useState(false);

  const handleRegisterClick = () => {
    setIsActive(true);
  };

  const handleLoginClick = () => {
    setIsActive(false);
  };

  const handleSubmitLogin = (e) => {
    e.preventDefault();
    // Xử lý đăng nhập ở đây
    if (onLoginSuccess) onLoginSuccess();
  };

  const handleSubmitRegister = (e) => {
    e.preventDefault();
    // Xử lý đăng ký ở đây
  };

  return (
    <div className="auth-page">
      <div className={`auth-container container ${isActive ? "active" : ""}`}>
        <button className="close-btn" onClick={onClose}>
          <i className="bx bx-x"></i>
        </button>

        <div className="form-box login">
          <form onSubmit={handleSubmitLogin}>
            <h1>Login</h1>
            <div className="input-box">
              <input type="text" placeholder="Username" required />
              <i className="bx bxs-user"></i>
            </div>
            <div className="input-box">
              <input type="password" placeholder="Password" required />
              <i className="bx bxs-lock-alt"></i>
            </div>
            <div className="forgot-link">
              <a href="#">Forgot Password?</a>
            </div>
            <button type="submit" className="btn">
              Login
            </button>
            <p>or login with social platforms</p>
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
            <h1>Registration</h1>
            <div className="input-box">
              <input type="text" placeholder="Username" required />
              <i className="bx bxs-user"></i>
            </div>
            <div className="input-box">
              <input type="email" placeholder="Email" required />
              <i className="bx bxs-envelope"></i>
            </div>
            <div className="input-box">
              <input type="password" placeholder="Password" required />
              <i className="bx bxs-lock-alt"></i>
            </div>
            <button type="submit" className="btn">
              Register
            </button>
            <p>or register with social platforms</p>
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

        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1>Hello, Welcome!</h1>
            <p>Don't have an account?</p>
            <button className="btn register-btn" onClick={handleRegisterClick}>
              Register
            </button>
          </div>

          <div className="toggle-panel toggle-right">
            <h1>Welcome Back!</h1>
            <p>Already have an account?</p>
            <button className="btn login-btn" onClick={handleLoginClick}>
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
