import { Link, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";

function ArrowIcon() {
  return (
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
  );
}

export default function PublicNavbar() {
  const { pathname } = useLocation();
  const isLanding = pathname === "/";
  const isLogin = pathname === "/login";

  return (
    <header className="vpub-nav">
      <Link to="/" className="vpub-brand">
        <BrandLogo size={32} />
      </Link>

      <div className="vpub-nav-right">
        {isLanding ? (
          <Link className="vpub-button vpub-button--sm" to="/login">
            <span>Log in</span>
            <ArrowIcon />
          </Link>
        ) : isLogin ? (
          <>
            <span className="vpub-hint">No account?</span>
            <Link className="vpub-button vpub-button--sm" to="/register">
              <span>Sign up</span>
              <ArrowIcon />
            </Link>
          </>
        ) : (
          <>
            <span className="vpub-hint">Already have an account?</span>
            <Link className="vpub-button vpub-button--sm" to="/login">
              <span>Log in</span>
              <ArrowIcon />
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
