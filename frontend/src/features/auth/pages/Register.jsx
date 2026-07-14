import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSelector } from "react-redux";
import "../styles/auth.css";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loading = useSelector((state) => state.auth.loading);

  const { handleRegister } = useAuth();

  if (loading) {
    return <h1>Authenticating...</h1>;
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
    <section className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-card">
          <h1 className="auth-heading">Create Account</h1>
          <p className="auth-subtitle">
            Register with your username, email, and password.
          </p>

          <form onSubmit={submitForm} className="auth-form">
            <div>
              <label htmlFor="username" className="auth-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Choose a username"
                required
                className="auth-input"
              />
            </div>

            <div>
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

            <div>
              <label htmlFor="password" className="auth-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                required
                className="auth-input"
              />
            </div>

            <button type="submit" className="auth-button">
              Register
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Login
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Register;
