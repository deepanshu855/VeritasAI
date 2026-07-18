import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../styles/auth.css";
import { useAuth } from "../hooks/useAuth";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { handleResetPassword } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    handleResetPassword(password, token);
  };

  return (
    <section className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-brand">VERITAS-AI</div>

        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-heading">Reset Password</h1>
            <p className="auth-subtitle">
              Enter your new password to update your account.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="auth-label" htmlFor="password">
                New Password
              </label>
              <input
                id="password"
                type="password"
                className="auth-input"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="auth-button" type="submit">
              Update Password
            </button>
          </form>

          <p className="auth-footer">
            <Link to="/login" className="auth-link">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;
