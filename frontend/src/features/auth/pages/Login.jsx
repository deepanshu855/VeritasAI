import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import "../styles/auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);

  const { handleLogin, handleForgotPassword } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  if (loading) {
    return (
      <section className="auth-page centered">
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </section>
    );
  }

  const submitForm = async (event) => {
    event.preventDefault();

    const payload = { email, password };

    await handleLogin(payload);

    navigate("/dashboard");
  };

  const forgotPasswordHandler = () => {
    handleForgotPassword(email);
  };

  return (
    <section className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-brand">VERITAS-AI</div>

        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-heading">Welcome Back</h1>
            <p className="auth-subtitle">
              Sign in with your email and password.
            </p>
          </div>

          <form onSubmit={submitForm} className="auth-form">
            <div className="input-group">
              <label htmlFor="email" className="auth-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="auth-input"
              />
            </div>

            <div className="input-group">
              <div className="label-row">
                <label htmlFor="password" className="auth-label">
                  Password
                </label>
                <div
                  onClick={forgotPasswordHandler}
                  to="/forgot-password"
                  className="forgot-password-link"
                >
                  Forgot password?
                </div>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                className="auth-input"
              />
            </div>

            <button type="submit" className="auth-button">
              Login
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Register
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Login;
