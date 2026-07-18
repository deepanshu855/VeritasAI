import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import "../../auth/styles/auth.css";

const PageNotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <section className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-brand">VERITAS-AI</div>

        <div className="auth-card text-center-card">
          <div className="not-found-icon">
            <AlertCircle size={56} strokeWidth={1.5} />
          </div>

          <div className="auth-header">
            <h1 className="not-found-title">404</h1>
            <p className="auth-subtitle">
              Oops! You seem to have wandered off-beat.
            </p>
          </div>

          <div className="redirect-badge">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>Redirecting to home...</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PageNotFound;
