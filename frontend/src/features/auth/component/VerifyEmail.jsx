import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSelector } from "react-redux";
import { CheckCircle, XCircle } from "lucide-react";
import "../styles/auth.css";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const { handleVerifyEmail } = useAuth();

  const loading = useSelector((state) => state.auth.loading);

  const [result, setResult] = useState(null);

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setResult({
          success: false,
          message: "Verification token is missing.",
        });
        return;
      }

      const response = await handleVerifyEmail(token);
      setResult(response);
    };

    verify();
  }, []);

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

  if (!result) {
    return null;
  }

  return (
    <section className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-brand">VERITAS-AI</div>

        <div className="auth-card text-center-card">
          {result.success ? (
            <>
              <div className="verify-icon success">
                <CheckCircle size={56} strokeWidth={1.5} />
              </div>
              <div className="auth-header">
                <h1 className="auth-heading">Email Verified</h1>
                <p className="auth-subtitle">{result.message}</p>
              </div>
            </>
          ) : (
            <>
              <div className="verify-icon error">
                <XCircle size={56} strokeWidth={1.5} />
              </div>
              <div className="auth-header">
                <h1 className="auth-heading">Verification Failed</h1>
                <p className="auth-subtitle">{result.message}</p>
              </div>
            </>
          )}

          <Link to="/login" className="auth-button btn-link">
            Go to Login
          </Link>
        </div>
      </div>
    </section>
  );
};

export default VerifyEmail;
