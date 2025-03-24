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
    phone: "",
    age: 0,
    address: "",
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
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("accessToken", response.data.accessToken);
        if (onLoginSuccess) onLoginSuccess();
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin."
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
      // Validate phone number
      if (!/^\d{10}$/.test(registerData.phone)) {
        throw new Error("Số điện thoại phải có 10 chữ số");
      }

      // Validate age
      const age = parseInt(registerData.age);
      if (isNaN(age) || age <= 0 || age > 122) {
        throw new Error("Tuổi phải là số dương và không quá 122");
      }

      const response = await axios.post("/auth/register", {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        phone: registerData.phone,
        age: age,
        address: registerData.address || "",
      });

      if (response.data) {
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        setIsActive(false); // Chuyển về form đăng nhập
        setLoginData({
          username: registerData.email,
          password: "",
        });
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin."
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
            <h1>Đăng Nhập</h1>
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
                placeholder="Mật khẩu"
                required
                value={loginData.password}
                onChange={handleLoginChange}
              />
              <i className="bx bxs-lock-alt"></i>
            </div>
            <div className="forgot-link">
              <a href="#">Quên mật khẩu?</a>
            </div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
            <p>hoặc đăng nhập với</p>
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
            <h1>Đăng Ký</h1>
            {error && isActive && <div className="error-message">{error}</div>}
            <div className="input-box">
              <input
                type="text"
                name="name"
                placeholder="Họ và tên"
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
                placeholder="Mật khẩu"
                required
                value={registerData.password}
                onChange={handleRegisterChange}
              />
              <i className="bx bxs-lock-alt"></i>
            </div>
            <div className="input-box">
              <input
                type="text"
                name="phone"
                placeholder="Số điện thoại"
                required
                value={registerData.phone}
                onChange={handleRegisterChange}
              />
              <i className="bx bxs-phone"></i>
            </div>
            <div className="input-box">
              <input
                type="number"
                name="age"
                placeholder="Tuổi"
                required
                value={registerData.age}
                onChange={handleRegisterChange}
              />
              <i className="bx bxs-calendar"></i>
            </div>
            <div className="input-box">
              <input
                type="text"
                name="address"
                placeholder="Địa chỉ"
                value={registerData.address}
                onChange={handleRegisterChange}
              />
              <i className="bx bxs-map"></i>
            </div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Đang xử lý..." : "Đăng ký"}
            </button>
          </form>
        </div>

        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1>Xin chào!</h1>
            <p>Bạn chưa có tài khoản?</p>
            <button className="btn register-btn" onClick={handleRegisterClick}>
              Đăng ký
            </button>
          </div>

          <div className="toggle-panel toggle-right">
            <h1>Chào mừng trở lại!</h1>
            <p>Bạn đã có tài khoản?</p>
            <button className="btn login-btn" onClick={handleLoginClick}>
              Đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
