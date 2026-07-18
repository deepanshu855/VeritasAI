import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import "../styles/auth.css";
import ShapeGrid from "../../shared/background/ShapeGrid.jsx";
// Assuming you have toast imported somewhere globally or at the top
import { toast } from "react-hot-toast"; // Adjust based on your toast library

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [userEmail, setUserEmail] = useState(""); // Added missing state
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);

  const { handleLogin, handleForgotPassword, handleResendVerifyEmail } = useAuth();

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
    try {
      setShowResend(false); // Reset state on new attempt
      const payload = { email, password };

      await handleLogin(payload);

      navigate("/dashboard");
    } catch (error) {
      const data = error.response?.data;

      if (data?.code === "EMAIL_NOT_VERIFIED") {
        setShowResend(true);
        setUserEmail(data.email);
      }
    }
  };

  const forgotPasswordHandler = () => {
    handleForgotPassword(email);
  };

  const handleResend = async () => {
    const result = await handleResendVerifyEmail(userEmail);

    if (result.success) {
      toast.success(result.message);
      setShowResend(false); // Optionally hide after success
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="auth-bg">
      <ShapeGrid
        speed={0.6}
        squareSize={40}
        direction="up" // Removed duplicate direction prop
        borderColor="#2F293A"
        hoverFillColor="#222"
        hoverTrailAmount={0}
        hoverColor="#222222"
        size={40}
        shape="square" // Removed duplicate shape prop
      />

      {/* Position absolute overlay to ensure it sits on top of ShapeGrid */}
      <section className="auth-content auth-page">
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
                  {/* Changed from div to button for semantic correctness & onClick handling */}
                  <button
                    type="button"
                    onClick={forgotPasswordHandler}
                    className="forgot-password-link btn-reset"
                  >
                    Forgot password?
                  </button>
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

              {/* Dedicated UI for Resend Verification */}
              {showResend && (
                <div className="resend-alert">
                  <p className="resend-text">Your email address has not been verified yet.</p>
                  <button type="button" onClick={handleResend} className="resend-button">
                    Resend Verification Email
                  </button>
                </div>
              )}

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
    </div>
  );
};

export default Login;