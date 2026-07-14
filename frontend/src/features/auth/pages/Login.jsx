import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import "../styles/auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);

  const { handleLogin } = useAuth();

  if (loading) {
    return <h1>Authenticating...</h1>;
  }

  const submitForm = async (event) => {
    event.preventDefault();

    const payload = { email, password };

    await handleLogin(payload);

    navigate("/dashboard");
  };

  return (
    <section className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-card">
          <h1 className="auth-heading">Welcome Back</h1>
          <p className="auth-subtitle">Sign in with your email and password.</p>

          <form onSubmit={submitForm} className="auth-form">
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
            Don&apos;t have an account?{" "}
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
