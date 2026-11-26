import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSelector } from "react-redux";
import { CheckCircle, XCircle } from "lucide-react";

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
      <main className="vauth-page">
        <div className="vauth-aside">
          <h1 className="vauth-headline">
            Verify your
            <br />
            <em>email</em>
          </h1>
          <p className="vauth-sub">Confirming your account details.</p>
        </div>
        <section className="vauth-card" style={{ display: "grid", placeItems: "center" }}>
          <span className="vauth-spinner" aria-label="Verifying email" />
        </section>
      </main>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <main className="vauth-page">
      <div className="vauth-aside">
        <h1 className="vauth-headline">
          Verify your
          <br />
          <em>email</em>
        </h1>
        <p className="vauth-sub">Confirming your account details.</p>
      </div>

      <section className="vauth-card" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          {result.success ? (
            <CheckCircle size={48} strokeWidth={1.5} color="#10b981" />
          ) : (
            <XCircle size={48} strokeWidth={1.5} color="#FF8A9B" />
          )}
        </div>
        <h2 className="vauth-title">
          {result.success ? "Email verified" : "Verification failed"}
        </h2>
        <p className="vauth-sub" style={{ margin: "0 auto 24px" }}>
          {result.message}
        </p>

        <Link to="/login" className="vpub-button vauth-button">
          Go to Log in
        </Link>
      </section>
    </main>
  );
};

export default VerifyEmail;
