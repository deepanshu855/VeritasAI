import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import PasswordInput from "../component/PasswordInput.jsx";
import GoogleButton from "../component/GoogleButton.jsx";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [googleError] = useState(() =>
    searchParams.get("error") === "google_failed"
      ? "Google sign-in failed. Please try again."
      : "",
  );
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);
  const error = useSelector((state) => state.auth.error);

  const { handleLogin, handleGoogleLogin } = useAuth();

  useEffect(() => {
    if (searchParams.get("error") === "google_failed") {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("error");
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (user) {
    return <Navigate to="/chat" />;
  }

  const submitForm = async (event) => {
    event.preventDefault();
    try {
      const payload = { email, password };

      await handleLogin(payload);

      navigate("/chat");
    } catch {
      // Error toast handled in useAuth
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

        <GoogleButton
          onClick={handleGoogleLogin}
          disabled={loading}
          error={googleError}
        />

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

          {error && (
            <p className="vauth-error" role="alert">
              {error}
            </p>
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
