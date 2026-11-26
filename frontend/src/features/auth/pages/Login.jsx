import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import PasswordInput from "../component/PasswordInput.jsx";
import { toast } from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);
  const error = useSelector((state) => state.auth.error);

  const { handleLogin, handleForgotPassword, handleResendVerifyEmail } = useAuth();

  if (user) {
    return <Navigate to="/chat" />;
  }

  const submitForm = async (event) => {
    event.preventDefault();
    try {
      setShowResend(false);
      const payload = { email, password };

      await handleLogin(payload);

      navigate("/chat");
    } catch (err) {
      const data = err.response?.data;

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
      setShowResend(false);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <main className="vauth-page">
      <div className="vauth-aside">
        <h1 className="vauth-headline">
          Welcome
          <br />
          <em>back</em>
        </h1>
        <p className="vauth-sub">Pick up where you left off.</p>
      </div>

      <section className="vauth-card">
        <h2 className="vauth-title">Log in</h2>

        <form className="vauth-form" onSubmit={submitForm}>
          <div className="vauth-input-wrap">
            <label className="vauth-sr" htmlFor="email">
              Email
            </label>
            <svg
              className="vauth-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <input
              id="email"
              className="vauth-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
              autoComplete="email"
            />
          </div>

          <PasswordInput
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            autoComplete="current-password"
          />

          <button
            type="button"
            onClick={forgotPasswordHandler}
            className="vauth-link vauth-forgot"
            style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
          >
            Forgot password?
          </button>

          {error && (
            <p className="vauth-error" role="alert">
              {error}
            </p>
          )}

          {showResend && (
            <div role="status">
              <p className="vauth-error" style={{ color: "#fbbf24" }}>
                Your email address has not been verified yet.{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  className="vauth-link"
                  style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
                >
                  Resend verification email
                </button>
              </p>
            </div>
          )}

          <button
            type="submit"
            className="vpub-button vauth-button"
            disabled={loading}
          >
            {loading ? (
              <span className="vauth-spinner" />
            ) : (
              <>
                <span>Log in</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        <p className="vauth-switch">
          Don&apos;t have an account?{" "}
          <Link className="vauth-link" to="/register">
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
};

export default Login;
