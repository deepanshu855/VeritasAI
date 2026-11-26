import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PasswordInput from "./PasswordInput.jsx";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { handleResetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleResetPassword(password, token);
    setPassword("");
  };

  return (
    <main className="vauth-page">
      <div className="vauth-aside">
        <h1 className="vauth-headline">
          Reset your
          <br />
          <em>password</em>
        </h1>
        <p className="vauth-sub">Enter a new password to secure your account.</p>
      </div>

      <section className="vauth-card">
        <h2 className="vauth-title">Reset password</h2>

        <form className="vauth-form" onSubmit={handleSubmit}>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            required
            autoComplete="new-password"
          />

          <button className="vpub-button vauth-button" type="submit">
            Update password
          </button>
        </form>

        <p className="vauth-switch">
          <Link className="vauth-link" to="/login">
            Back to Log in
          </Link>
        </p>
      </section>
    </main>
  );
};

export default ResetPassword;
