import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/auth.css";
import { useSearchParams } from "react-router-dom";
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
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-card">
          <h2 className="auth-heading">Reset Password</h2>
          <p className="auth-subtitle">
            Enter your new password to update your account.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div>
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
              <button className="auth-button" type="submit">
                Update Password
              </button>
            </div>
          </form>

          <div className="auth-footer">
            <Link to="/login" className="auth-link">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
