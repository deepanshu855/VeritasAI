import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSelector } from "react-redux";
import PasswordInput from "../component/PasswordInput.jsx";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loading = useSelector((state) => state.auth.loading);
  const user = useSelector((state) => state.auth.user);
  const error = useSelector((state) => state.auth.error);

  const { handleRegister } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const submitForm = async (event) => {
    event.preventDefault();

    const payload = {
      username,
      email,
      password,
    };

    await handleRegister(payload);
  };

  return (
    <main className="vauth-page">
      <div className="vauth-aside">
        <h1 className="vauth-headline">
          Create your
          <br />
          <em>account</em>
        </h1>
        <p className="vauth-sub">Ask the web and your documents, with sources.</p>
      </div>

      <section className="vauth-card">
        <h2 className="vauth-title">Register</h2>

        <form className="vauth-form" onSubmit={submitForm}>
          <div className="vauth-input-wrap">
            <label className="vauth-sr" htmlFor="username">
              Username
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              id="username"
              className="vauth-input"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
              required
              autoComplete="username"
            />
          </div>

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
            autoComplete="new-password"
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
                Create account
              </>
            )}
          </button>
        </form>

        <p className="vauth-switch">
          Already have an account?{" "}
          <Link className="vauth-link" to="/login">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
};

export default Register;
