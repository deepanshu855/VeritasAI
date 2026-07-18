import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSelector } from "react-redux";
import "../styles/auth.css";
import ShapeGrid from "../../shared/background/ShapeGrid.jsx";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loading = useSelector((state) => state.auth.loading);
  const user = useSelector((state) => state.auth.user);

  const { handleRegister } = useAuth();

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

    const payload = {
      username,
      email,
      password,
    };

    await handleRegister(payload);
  };

  return (
    <div className="auth-bg">
      <ShapeGrid
        speed={0.6}
        squareSize={40}
        direction="diagonal" // up, down, left, right, diagonal
        borderColor="#2F293A"
        hoverFillColor="#222"
        shape="square" // square, hexagon, circle, triangle
        hoverTrailAmount={0} // number of trailing hovered shapes (0 = no trail)
        direction="up"
        hoverColor="#222222"
        size={40}
        shape="square"
      />

      <section className="auth-content auth-page">
        <div className="auth-wrapper">
          <div className="auth-brand">VERITAS-AI</div>

          <div className="auth-card">
            <div className="auth-header">
              <h1 className="auth-heading">Create Account</h1>
              <p className="auth-subtitle">
                Register with your username, email, and password.
              </p>
            </div>

            <form onSubmit={submitForm} className="auth-form">
              <div className="input-group">
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
    </div>
  );
};

export default Register;
