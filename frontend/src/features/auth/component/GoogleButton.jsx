import React from "react";

export default function GoogleButton({ onClick, disabled = false, error = "" }) {
  return (
    <>
      <button
        type="button"
        className="vauth-google-btn"
        onClick={onClick}
        disabled={disabled}
      >
        <svg
          className="vauth-google-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="#EA4335"
            d="M12 5.04c1.94 0 3.51.68 4.75 1.81l3.51-3.51C18.13 1.37 15.3 0 12 0 7.31 0 3.26 2.69 1.29 6.61l4.09 3.17C6.35 6.86 8.95 5.04 12 5.04z"
          />
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.72 2.89c2.17-2.01 3.7-4.96 3.7-8.71z"
          />
          <path
            fill="#FBBC05"
            d="M5.38 14.22A7.12 7.12 0 0 1 5 12c0-.77.14-1.52.38-2.22L1.29 6.61A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.29 5.39l4.09-3.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.72-2.89c-1.07.72-2.45 1.16-4.21 1.16-3.05 0-5.65-1.82-6.62-4.74l-4.09 3.17C3.26 21.31 7.31 24 12 24z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      {error && (
        <p className="vauth-error vauth-google-error" role="alert">
          {error}
        </p>
      )}

      <div className="vauth-divider" aria-hidden="true">
        <span>or</span>
      </div>
    </>
  );
}

